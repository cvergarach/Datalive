import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import mcpClient from '../services/mcp-client.js';
import intelligenceService from '../services/intelligence.js';
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

    console.log(`🔑 Configuring API ${apiId}`);

    // 1. Initial save as 'pending'
    const { data: config, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .upsert({
        api_id: apiId,
        credentials,
        is_active: true,
        last_tested: new Date().toISOString(),
        test_status: 'pending'
      }, {
        onConflict: 'api_id'
      })
      .select()
      .single();

    if (configError) throw configError;

    // 2. Perform connection test asynchronously via MCP
    try {
      // Get API base URL for testing
      const { data: apiData } = await supabaseAdmin
        .from('discovered_apis')
        .select('base_url')
        .eq('id', apiId)
        .single();

      if (apiData?.base_url) {
        console.log(`📡 Testing connection to ${apiData.base_url}...`);
        const testResult = await mcpClient.testAPIConnection(apiData.base_url, {
          auth_type: (await supabaseAdmin.from('discovered_apis').select('auth_type').eq('id', apiId).single()).data?.auth_type,
          credentials
        });

        // 3. Update status based on test result
        await supabaseAdmin
          .from('api_configurations')
          .update({
            test_status: testResult.success ? 'success' : 'failed',
            last_tested: new Date().toISOString()
          })
          .eq('api_id', apiId);

        config.test_status = testResult.success ? 'success' : 'failed';
      }
    } catch (testError) {
      console.error('⚠️ Connection test failed:', testError.message);
      await supabaseAdmin
        .from('api_configurations')
        .update({ test_status: 'failed' })
        .eq('api_id', apiId);
      config.test_status = 'failed';
    }

    res.json({
      message: config.test_status === 'success' ? 'API configured and verified' : 'API configured but verification failed',
      config
    });
  } catch (error) {
    console.error('❌ Configure error:', error);
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
    const { endpoint_id, endpoint_ids, parameters } = req.body;
    const targetEndpointId = endpoint_id || (endpoint_ids && endpoint_ids[0]);

    if (!targetEndpointId) {
      return res.status(400).json({ error: 'No endpoint specified for execution.' });
    }

    console.log(`🚀 Executing endpoint ${targetEndpointId} for API ${apiId}`);

    // Get API details
    const { data: api, error: apiError } = await supabaseAdmin
      .from('discovered_apis')
      .select('*')
      .eq('id', apiId)
      .single();

    if (apiError || !api) {
      return res.status(404).json({ error: 'API not found' });
    }

    // Get API config (credentials) - Optional
    const { data: config } = await supabaseAdmin
      .from('api_configurations')
      .select('credentials')
      .eq('api_id', apiId)
      .eq('is_active', true)
      .maybeSingle();

    const credentials = config?.credentials || {};

    // Get the specific endpoint
    const { data: endpoint, error: endpointError } = await supabaseAdmin
      .from('api_endpoints')
      .select('*')
      .eq('id', targetEndpointId)
      .single();

    if (endpointError || !endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const startTime = Date.now();
    const results = [];

    try {
      // Build URL
      let url = `${api.base_url}${endpoint.path}`;

      // Build headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth
      if (api.auth_type === 'basic' && credentials.username && credentials.password) {
        const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else if (api.auth_type === 'bearer' && credentials.api_key) {
        headers['Authorization'] = `Bearer ${credentials.api_key}`;
      } else if (api.auth_type === 'api_key' && credentials.api_key) {
        headers['X-API-Key'] = credentials.api_key;
      } else if (api.auth_type === 'token' && credentials.api_key) {
        headers['Authorization'] = credentials.api_key;
      }

      // Merge saved credentials into parameters (to avoid asking user for ticket/token every time)
      const requestParams = {
        ...credentials, // Use all saved credentials as base (includes ticket, token, etc)
        ...parameters   // Override with manually provided params if any
      };

      // Ensure ticket is handled if specific to this API
      if (api.auth_type === 'ticket' && credentials.ticket) {
        requestParams.ticket = credentials.ticket;
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
          executed_at: new Date().toISOString(),
          status: response.ok ? 'success' : 'error'
        });

      // Trigger Auto-Intelligence in background
      intelligenceService.triggerAutoIntelligence(projectId, parsedData).catch(err => {
        console.error('⚠️ Background Auto-Intelligence Error:', err.message);
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

