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

    console.log(`🧠 [INSIGHTS] Starting generation for project: ${projectId}`);

    // Fetch actual data content if data_ids are provided, or fetch most recent if empty
    let dataContent = [];
    if (data_ids && data_ids.length > 0) {
      console.log(`🔍 [INSIGHTS] Fetching specifically ${data_ids.length} records by ID`);
      const { data: records, error: fetchError } = await supabaseAdmin
        .from('api_data')
        .select('data, executed_at')
        .in('id', data_ids);

      if (fetchError) console.error(`❌ [INSIGHTS] Error fetching specific records:`, fetchError);
      dataContent = records || [];
    } else {
      console.log(`🔍 [INSIGHTS] No data_ids provided, fetching last 10 records for project ${projectId}`);
      const { data: records, error: fetchError } = await supabaseAdmin
        .from('api_data')
        .select('data, executed_at')
        .eq('project_id', projectId)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (fetchError) console.error(`❌ [INSIGHTS] Error fetching recent records:`, fetchError);
      dataContent = records || [];
    }

    console.log(`📊 [INSIGHTS] Total data records found for analysis: ${dataContent.length}`);

    if (dataContent.length === 0) {
      console.warn('⚠️ [INSIGHTS] No data found to generate insights.');
      return res.json({ insights: [], message: 'No hay datos disponibles para analizar. Ejecuta una API primero.' });
    }

    console.log(`🤖 [INSIGHTS] Calling MCP Insight Generator...`);
    const result = await mcpClient.generateInsights(projectId, dataContent);
    console.log(`📥 [INSIGHTS] MCP Result received:`, result ? 'SUCCESS' : 'NULL/ERROR');

    if (result && result.insights && result.insights.length > 0) {
      console.log(`💾 [INSIGHTS] Saving ${result.insights.length} insight(s) to database...`);

      console.log(`💾 Saving ${result.insights.length} insight(s) to database...`);


      const insightsToInsert = result.insights.map(insight => ({
        project_id: projectId,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        source_data_ids: data_ids,
        metadata: {
          actionable_next_step: insight.actionable_next_step
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
