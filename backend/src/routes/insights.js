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
    const { data: insights, error } = await supabaseAdmin
      .from('insights')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data_ids } = req.body;
    const insights = await mcpClient.generateInsights(projectId, data_ids);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:insightId', async (req, res) => {
  try {
    const { projectId, insightId } = req.params;
    const { error } = await supabaseAdmin
      .from('insights')
      .delete()
      .eq('id', insightId)
      .eq('project_id', projectId);
    if (error) throw error;
    res.json({ message: 'Insight deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
