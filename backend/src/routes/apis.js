import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import mcpClient from '../services/mcp-client.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);

/**
 * GET /api/projects/:projectId/apis
 * Get all discovered APIs
 */
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: apis, error } = await supabaseAdmin
      .from('discovered_apis')
      .select(`
        *,
        api_documents(title),
        api_configurations(id, is_active, last_tested, test_status),
        api_endpoints(count)
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    res.json({ apis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/apis/:apiId
 * Get specific API with endpoints
 */
router.get('/:apiId', async (req, res) => {
  try {
    const { projectId, apiId } = req.params;

    const { data: api, error } = await supabaseAdmin
      .from('discovered_apis')
      .select(`
        *,
        api_endpoints(*),
        api_configurations(*)
      `)
      .eq('id', apiId)
      .eq('project_id', projectId)
      .single();

    if (error) throw error;

    res.json({ api });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/apis/:apiId/configure
 * Configure API with credentials
 */
router.post('/:apiId/configure', async (req, res) => {
  try {
    const { projectId, apiId } = req.params;
    const { credentials } = req.body;

    // Get API info
    const { data: api, error: apiError } = await supabaseAdmin
      .from('discovered_apis')
      .select('base_url, auth_type')
      .eq('id', apiId)
      .single();

    if (apiError) throw apiError;

    // Test connection
    const testResult = await mcpClient.testAPIConnection(api.base_url, {
      type: api.auth_type,
      credentials
    });

    // Save configuration (always mark as active, user can test manually)
    const { data: config, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .upsert({
        api_id: apiId,
        credentials,
        is_active: true, // Always active, let user test manually
        last_tested: new Date().toISOString(),
        test_status: testResult.success ? 'success' : 'failed'
      }, {
        onConflict: 'api_id'
      })
      .select()
      .single();

    if (configError) throw configError;

    res.json({
      message: testResult.success ? 'API configured successfully' : 'Configuration saved but test failed',
      config,
      test_result: testResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/apis/:apiId/execute
 * Execute API endpoints
 */
router.post('/:apiId/execute', async (req, res) => {
  try {
    const { projectId, apiId } = req.params;
    const { endpoint_ids, parameters } = req.body;

    console.log(`🚀 Executing endpoint for API ${apiId}`);

    // Get API details
    const { data: api, error: apiError } = await supabaseAdmin
      .from('discovered_apis')
      .select('*')
      .eq('id', apiId)
      .single();

    if (apiError || !api) {
      return res.status(404).json({ error: 'API not found' });
    }

    // Get API config (credentials)
    const { data: config, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .select('credentials')
      .eq('api_id', apiId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return res.status(400).json({ error: 'API not configured. Please configure credentials first.' });
    }

    // Get endpoints
    const { data: endpoints, error: endpointsError } = await supabaseAdmin
      .from('api_endpoints')
      .select('*')
      .eq('api_id', apiId)
      .in('id', endpoint_ids || []);

    if (endpointsError) throw endpointsError;

    if (!endpoints || endpoints.length === 0) {
      return res.status(404).json({ error: 'No endpoints found' });
    }

    // Execute each endpoint
    const results = [];
    for (const endpoint of endpoints) {
      const startTime = Date.now();

      try {
        // Build URL
        let url = `${api.base_url}${endpoint.path}`;

        // Build headers
        const headers = {
          'Content-Type': 'application/json'
        };

        // Add auth
        if (api.auth_type === 'basic' && config.credentials.username && config.credentials.password) {
          const auth = Buffer.from(`${config.credentials.username}:${config.credentials.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        } else if (api.auth_type === 'bearer' && config.credentials.api_key) {
          headers['Authorization'] = `Bearer ${config.credentials.api_key}`;
        } else if (api.auth_type === 'api_key' && config.credentials.api_key) {
          headers['X-API-Key'] = config.credentials.api_key;
        }

        // Add parameters
        const requestParams = { ...parameters };

        // For ticket auth, add ticket to params
        if (api.auth_type === 'ticket' && config.credentials.ticket) {
          requestParams.ticket = config.credentials.ticket;
        }

        // Make request
        let response;

        // Create agent for HTTPS with self-signed certificates
        const agent = api.base_url.startsWith('https')
          ? new (await import('https')).Agent({ rejectUnauthorized: false })
          : undefined;

        if (endpoint.method === 'GET') {
          const queryString = new URLSearchParams(requestParams).toString();
          url = queryString ? `${url}?${queryString}` : url;

          console.log(`📡 GET ${url}`);
          response = await fetch(url, { headers, agent });
        } else {
          console.log(`📡 ${endpoint.method} ${url}`);
          response = await fetch(url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(requestParams),
            agent
          });
        }

        const duration = Date.now() - startTime;
        const responseData = await response.text();

        let parsedData;
        try {
          parsedData = JSON.parse(responseData);
        } catch {
          parsedData = responseData;
        }

        results.push({
          endpoint_id: endpoint.id,
          success: response.ok,
          status_code: response.status,
          data: parsedData,
          duration_ms: duration
        });

        // Save to database
        await supabaseAdmin
          .from('api_data')
          .insert({
            project_id: projectId,
            api_id: apiId,
            endpoint_id: endpoint.id,
            data: parsedData,
            record_count: Array.isArray(parsedData) ? parsedData.length : 1,
            execution_duration: duration,
            status: response.ok ? 'success' : 'error'
          });

      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          endpoint_id: endpoint.id,
          success: false,
          error: error.message,
          duration_ms: duration
        });
      }
    }

    res.json({
      message: 'Execution completed',
      results
    });
  } catch (error) {
    console.error('❌ Execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/apis/:apiId/auto-execute
 * Automatically configure and execute all endpoints
 */
router.post('/:apiId/auto-execute', async (req, res) => {
  try {
    const { projectId, apiId } = req.params;

    console.log(`🚀 Auto-executing API ${apiId}`);

    // Get API with metadata
    const { data: api, error: apiError } = await supabaseAdmin
      .from('discovered_apis')
      .select('*')
      .eq('id', apiId)
      .single();

    if (apiError || !api) {
      return res.status(404).json({ error: 'API not found' });
    }

    // Check if auto-executable
    if (!api.metadata?.auto_executable) {
      return res.status(400).json({
        error: 'API is not auto-executable. Manual configuration required.'
      });
    }

    // Auto-configure with extracted credentials
    const extractedCreds = api.metadata.extracted_credentials;
    if (!extractedCreds) {
      return res.status(400).json({
        error: 'No credentials found in document'
      });
    }

    console.log(`  🔑 Auto-configuring with extracted credentials`);

    // Save configuration
    await supabaseAdmin
      .from('api_configurations')
      .upsert({
        api_id: apiId,
        credentials: extractedCreds,
        is_active: true,
        auto_configured: true
      }, {
        onConflict: 'api_id'
      });

    // Get endpoints
    const { data: endpoints } = await supabaseAdmin
      .from('api_endpoints')
      .select('*')
      .eq('api_id', apiId)
      .order('id');

    if (!endpoints || endpoints.length === 0) {
      return res.status(404).json({ error: 'No endpoints found' });
    }

    console.log(`  📡 Executing ${endpoints.length} endpoints...`);

    // Execute endpoints in sequence
    const results = [];
    let authToken = null;

    for (const endpoint of endpoints) {
      const startTime = Date.now();

      try {
        // Build URL
        let url = `${api.base_url}${endpoint.path}`;

        // Build headers
        const headers = {
          'Content-Type': 'application/json'
        };

        // Add auth
        if (authToken) {
          headers['X-Auth-Token'] = authToken;
        } else if (api.auth_type === 'basic' && extractedCreds.username && extractedCreds.password) {
          const auth = Buffer.from(`${extractedCreds.username}:${extractedCreds.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        } else if (api.auth_type === 'bearer' && extractedCreds.api_key) {
          headers['Authorization'] = `Bearer ${extractedCreds.api_key}`;
        }

        // Smart parameter inference
        const params = {};
        if (endpoint.parameters) {
          for (const param of endpoint.parameters) {
            // Use auto_value if provided
            if (param.auto_value) {
              params[param.name] = param.auto_value;
            }
            // Use example if provided
            else if (param.example) {
              params[param.name] = param.example;
            }
            // Infer from credentials
            else if (param.name === 'username' || param.name === 'userName') {
              params[param.name] = extractedCreds.username;
            }
            else if (param.name === 'password' || param.name === 'value') {
              params[param.name] = extractedCreds.password;
            }
            else if (param.name === 'grantType') {
              params[param.name] = 'password';
            }
            // For ticket auth
            else if (param.name === 'ticket' && extractedCreds.ticket) {
              params[param.name] = extractedCreds.ticket;
            }
          }
        }

        // Make request with axios (supports SSL bypass properly)
        const https = await import('https');
        const axios = (await import('axios')).default;

        const httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });

        let response;
        try {
          if (endpoint.method === 'GET') {
            const queryString = new URLSearchParams(params).toString();
            url = queryString ? `${url}?${queryString}` : url;

            console.log(`    📡 GET ${url}`);
            response = await axios.get(url, {
              headers,
              httpsAgent,
              timeout: 30000
            });
          } else {
            console.log(`    📡 ${endpoint.method} ${url}`);
            response = await axios({
              method: endpoint.method,
              url,
              headers,
              data: params,
              httpsAgent,
              timeout: 30000
            });
          }

          const duration = Date.now() - startTime;
          const parsedData = response.data;

          // Extract token if auth endpoint
          if (endpoint.category === 'auth' && response.status >= 200 && response.status < 300) {
            // Try to find token in response
            if (parsedData.token) authToken = parsedData.token;
            else if (parsedData.access_token) authToken = parsedData.access_token;
            else if (parsedData.accessToken) authToken = parsedData.accessToken;
          }

          results.push({
            endpoint_id: endpoint.id,
            endpoint_path: endpoint.path,
            method: endpoint.method,
            success: true,
            status_code: response.status,
            data: parsedData,
            duration_ms: duration
          });

          // Save to database
          await supabaseAdmin
            .from('api_data')
            .insert({
              project_id: projectId,
              api_id: apiId,
              endpoint_id: endpoint.id,
              data: parsedData,
              record_count: Array.isArray(parsedData) ? parsedData.length : 1,
              execution_duration: duration,
              status: response.status >= 200 && response.status < 300 ? 'success' : 'error'
            });

          console.log(`    ✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);

        } catch (axiosError) {
          const duration = Date.now() - startTime;
          const error = axiosError.response ? {
            message: `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`,
            data: axiosError.response.data
          } : axiosError;

          console.error(`    ❌ ${endpoint.method} ${endpoint.path} - ${error.message || axiosError.message}`);
          console.error(`    🔍 Error details:`, {
            name: axiosError.name,
            message: axiosError.message,
            code: axiosError.code,
            status: axiosError.response?.status
          });

          results.push({
            endpoint_id: endpoint.id,
            endpoint_path: endpoint.path,
            method: endpoint.method,
            success: false,
            error: error.message || axiosError.message,
            error_details: {
              name: axiosError.name,
              code: axiosError.code,
              status: axiosError.response?.status
            },
            duration_ms: duration
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`  ✅ Auto-execution completed: ${successCount}/${results.length} successful`);

    res.json({
      message: `Auto-execution completed: ${successCount}/${results.length} successful`,
      results,
      auto_configured: true
    });
  } catch (error) {
    console.error('❌ Auto-execution error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * DELETE /api/projects/:projectId/apis/:apiId
 * Delete a specific discovered API
 */
router.delete('/:apiId', async (req, res) => {
  try {
    const { projectId, apiId } = req.params;

    const { error } = await supabaseAdmin
      .from('discovered_apis')
      .delete()
      .eq('id', apiId)
      .eq('project_id', projectId);

    if (error) throw error;

    res.json({ message: 'API deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

