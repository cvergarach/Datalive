import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'generate_insights') {
      const result = await generateInsights(params.project_id, params.data_ids);
      return res.json(result);
    }

    if (tool === 'suggest_dashboards') {
      const result = await suggestDashboards(params.project_id, params.data_schema);
      return res.json(result);
    }

    if (tool === 'generate_report') {
      const result = await generateReport(params.project_id, params.config);
      return res.json(result);
    }

    res.status(400).json({ error: 'Unknown tool' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function generateInsights(projectId, dataIds) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze this data and generate insights. Look for trends, anomalies, correlations, and recommendations.
      
Return JSON with:
{
  "insights": [{
    "type": "trend|anomaly|correlation|recommendation",
    "title": "Short title",
    "description": "Detailed description",
    "confidence": 0.95
  }]
}`
    }]
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };
}

async function suggestDashboards(projectId, dataSchema) {
  return { dashboards: [] };
}

async function generateReport(projectId, config) {
  return { report: {} };
}

app.listen(PORT, () => {
  console.log(`🧠 MCP Insight Generator running on port ${PORT}`);
});
