import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import mcpClient from '../services/mcp-client.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';
const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabaseAdmin.from('dashboards').select('*').eq('project_id', projectId);
    if (error) throw error;
    res.json({ dashboards: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📊 Suggesting dashboards for project ${projectId}...`);

    const { data: recentRecords } = await supabaseAdmin
      .from('api_data')
      .select('data, executed_at')
      .eq('project_id', projectId)
      .order('executed_at', { ascending: false })
      .limit(3);

    const result = await mcpClient.suggestDashboards(projectId, recentRecords || []);

    if (result.dashboards && result.dashboards.length > 0) {

      console.log(`💾 Saving ${result.dashboards.length} dashboard suggestion(s)...`);

      const dashboardsToInsert = result.dashboards.map(db => ({
        project_id: projectId,
        title: db.title,
        config: { widgets: db.widgets },
        is_active: true
      }));

      const { data, error } = await supabaseAdmin
        .from('dashboards')
        .insert(dashboardsToInsert)
        .select();

      if (error) throw error;
      return res.json({ dashboards: data });
    }

    res.json({ dashboards: [] });
  } catch (error) {
    console.error('❌ Dashboard generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:dashboardId', async (req, res) => {
  try {
    const { projectId, dashboardId } = req.params;
    const { error } = await supabaseAdmin
      .from('dashboards')
      .delete()
      .eq('id', dashboardId)
      .eq('project_id', projectId);
    if (error) throw error;
    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
