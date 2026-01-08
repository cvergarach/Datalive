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

    console.log(`🧠 Generating insights for project ${projectId}...`);

    // Fetch actual data content if data_ids are provided
    let dataContent = [];
    if (data_ids && data_ids.length > 0) {
      const { data: records } = await supabaseAdmin
        .from('api_data')
        .select('data, executed_at')
        .in('id', data_ids);
      dataContent = records || [];
    }

    const result = await mcpClient.generateInsights(projectId, dataContent);

    if (result.insights && result.insights.length > 0) {
      console.log(`💾 Saving ${result.insights.length} insight(s) to database...`);


      const insightsToInsert = result.insights.map(insight => ({
        project_id: projectId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        metadata: {
          actionable_next_step: insight.actionable_next_step,
          source_data_ids: data_ids
        }
      }));

      const { data, error } = await supabaseAdmin
        .from('insights')
        .insert(insightsToInsert)
        .select();

      if (error) throw error;
      return res.json({ insights: data });
    }

    res.json({ insights: [] });
  } catch (error) {
    console.error('❌ Insight generation error:', error);
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
