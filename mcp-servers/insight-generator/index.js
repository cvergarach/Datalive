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
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are an expert Business Intelligence Analyst. Analyze the provided API response data and generate strategic executive insights.

Goal: Transform technical API data into business value.

Return ONLY a valid JSON object with the following structure:
{
  "insights": [{
    "type": "trend|anomaly|correlation|recommendation",
    "title": "Clear concise headline",
    "description": "Evidence-based explanation of the insight",
    "confidence": 0.0 to 1.0 (float),
    "actionable_next_step": "Specific recommendation based on this insight"
  }]
}

Context for Project ID: ${projectId}
Data Context (IDs): ${JSON.stringify(dataIds)}`
    }]
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };
}

async function suggestDashboards(projectId, dataSchema) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Based on this data schema, suggest 3-5 high-impact dashboard visualizations.

Return ONLY a valid JSON object with the following structure:
{
  "dashboards": [{
    "title": "Dashboard Name",
    "widgets": [{
      "type": "bar|line|pie|stat|table",
      "title": "Widget Title",
      "description": "Explain what this visualization shows",
      "suggested_fields": ["field1", "field2"]
    }]
  }]
}

Data Schema: ${JSON.stringify(dataSchema)}`
    }]
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { dashboards: [] };
}

async function generateReport(projectId, config) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Generate a comprehensive executive report based on the provided insights and data summaries.

The report must be in professional GitHub-style Markdown.
Include:
1. Executive Summary
2. Key Findings (with data evidence)
3. Operational Recommendations
4. Strategic Outlook

Report Configuration: ${JSON.stringify(config)}`
    }]
  });

  return {
    report: {
      content: message.content[0].text,
      generated_at: new Date().toISOString()
    }
  };
}

app.listen(PORT, () => {
  console.log(`🧠 MCP Insight Generator running on port ${PORT}`);
});
