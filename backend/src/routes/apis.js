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

    console.log(`🔑 Configuring API ${apiId}`);

    // Save configuration directly (no testing, keep it simple)
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

    res.json({
      message: 'API configured successfully',
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
      }

      // Add parameters
      const requestParams = { ...parameters };

      // For ticket auth, add ticket to params if it exists in credentials
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

