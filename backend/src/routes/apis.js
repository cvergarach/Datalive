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

    // Save configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .upsert({
        api_id: apiId,
        credentials,
        is_active: testResult.success,
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
    const { endpoint_ids } = req.body; // Array of endpoint IDs to execute

    // Get API config
    const { data: config, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .select('credentials, discovered_apis(base_url, auth_type)')
      .eq('api_id', apiId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return res.status(400).json({ error: 'API not configured or inactive' });
    }

    // Get endpoints
    const { data: endpoints, error: endpointsError } = await supabaseAdmin
      .from('api_endpoints')
      .select('*')
      .eq('api_id', apiId)
      .in('id', endpoint_ids || []);

    if (endpointsError) throw endpointsError;

    // Execute via MCP
    const results = await mcpClient.batchExecute(
      endpoints.map(ep => ({
        method: ep.method,
        path: ep.path,
        params: ep.parameters
      })),
      {
        type: config.discovered_apis.auth_type,
        credentials: config.credentials
      },
      projectId
    );

    // Save data
    const dataToInsert = results.map((result, index) => ({
      project_id: projectId,
      api_id: apiId,
      endpoint_id: endpoints[index].id,
      data: result.data,
      record_count: Array.isArray(result.data) ? result.data.length : 1,
      execution_duration: result.duration_ms,
      status: result.success ? 'success' : 'error'
    }));

    const { data: savedData, error: dataError } = await supabaseAdmin
      .from('api_data')
      .insert(dataToInsert)
      .select();

    if (dataError) throw dataError;

    // Trigger insight generation
    mcpClient.generateInsights(projectId, savedData.map(d => d.id))
      .catch(err => console.error('Insight generation error:', err));

    res.json({
      message: 'API execution completed',
      results: savedData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
