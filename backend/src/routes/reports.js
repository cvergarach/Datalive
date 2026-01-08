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
    const { data, error } = await supabaseAdmin.from('reports').select('*').eq('project_id', projectId);
    if (error) throw error;
    res.json({ reports: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { config } = req.body;

    console.log(`📝 Generating executive report for project ${projectId}...`);
    const result = await mcpClient.generateReport(projectId, config);

    if (result.report) {
      console.log(`💾 Saving generated report to database...`);

      const { data, error } = await supabaseAdmin
        .from('reports')
        .insert({
          project_id: projectId,
          title: config.title || 'Executive Report',
          content: result.report.content,
          status: 'generated',
          metadata: {
            generated_at: result.report.generated_at,
            config
          }
        })
        .select()
        .single();

      if (error) throw error;
      return res.json({ report: data });
    }

    res.status(500).json({ error: 'Failed to generate report content' });
  } catch (error) {
    console.error('❌ Report generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:reportId', async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('project_id', projectId);
    if (error) throw error;
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
