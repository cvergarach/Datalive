import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
app.use(express.json({ limit: '50mb' }));

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DEFAULT_CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const CLAUDE_MODEL_MAP = {
  'haiku': 'claude-3-5-haiku-20241022',
  'sonnet': 'claude-3-5-sonnet-20241022'
};

app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'generate_insights') {
      const result = await generateInsights(params.project_id, params.data_ids, params.settings);
      return res.json(result);
    }

    if (tool === 'suggest_dashboards') {
      const result = await suggestDashboards(params.project_id, params.data_schema, params.settings);
      return res.json(result);
    }

    if (tool === 'generate_report') {
      const result = await generateReport(params.project_id, params.config, params.settings);
      return res.json(result);
    }

    res.status(400).json({ error: 'Unknown tool' });
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function callAI(prompt, settings) {
  const modelToUse = settings?.ai_model || 'sonnet';
  const isClaude = modelToUse === 'haiku' || modelToUse === 'sonnet';
  const effectiveModel = isClaude ? (CLAUDE_MODEL_MAP[modelToUse] || DEFAULT_CLAUDE_MODEL) : 'gemini-2.5-flash';

  console.log(`🧠 Calling ${isClaude ? 'Claude' : 'Gemini'} (${effectiveModel})...`);

  if (isClaude) {
    const message = await anthropic.messages.create({
      model: effectiveModel,
      max_tokens: 4000,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }]
    });
    return message.content[0].text;
  } else {
    const result = await genAI.models.generateContent({
      model: effectiveModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4000, temperature: 0.4 }
    });
    return result.text;
  }
}

async function generateInsights(projectId, dataIds, settings = null) {
  const prompt = `Eres un experto Analista de Inteligencia de Negocios (BI). Tu tarea es analizar datos capturados de APIs y generar INSIGHTS ESTRATÉGICOS de nivel ejecutivo.

REGLAS CRÍTICAS:
1. **IDIOMA**: TODO debe estar en ESPAÑOL.
2. **TONO COMERCIAL**: No hables de endpoints, JSON o bases de datos. Habla de "Tendencias de Venta", "Eficiencia Operativa", "Comportamiento del Cliente".
3. **VALOR DE NEGOCIO**: Explica por qué es importante para la rentabilidad o gestión empresarial.

Retorna UNICAMENTE un objeto JSON válido con esta estructura:
{
  "insights": [{
    "type": "trend|anomaly|correlation|recommendation",
    "title": "Titular comercial claro",
    "description": "Explicación basada en datos del hallazgo",
    "confidence": 0.0 a 1.0,
    "actionable_next_step": "Acción específica de negocio"
  }]
}

Contexto: Proyecto ${projectId}, Datos ${JSON.stringify(dataIds)}`;

  const response = await callAI(prompt, settings);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };
}

async function suggestDashboards(projectId, dataSchema, settings = null) {
  const prompt = `Basado en este esquema de datos, sugiere 3-5 visualizaciones de dashboard de alto impacto para ejecutivos.

REGLAS:
1. **IDIOMA**: ESPAÑOL.
2. **ENFOQUE**: Toma de decisiones y KPI comerciales.

Retorna UNICAMENTE un objeto JSON válido:
{
  "dashboards": [{
    "title": "Nombre del Tablero",
    "widgets": [{
      "type": "bar|line|pie|stat|table",
      "title": "Título del Gráfico",
      "description": "Qué decisión ayuda a tomar este gráfico",
      "suggested_fields": ["campo1", "campo2"]
    }]
  }]
}

Esquema: ${JSON.stringify(dataSchema)}`;

  const response = await callAI(prompt, settings);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { dashboards: [] };
}

async function generateReport(projectId, config, settings = null) {
  const prompt = `Genera un reporte ejecutivo integral basado en los insights y datos proporcionados.

REGLAS:
1. **IDIOMA**: ESPAÑOL.
2. **FORMATO**: Markdown profesional estilo GitHub.
3. **CONTENIDO**:
   - Resumen Ejecutivo
   - Hallazgos Clave (con evidencia)
   - Recomendaciones Operativas
   - Perspectiva Estratégica

Configuración: ${JSON.stringify(config)}`;

  const response = await callAI(prompt, settings);
  return {
    report: {
      content: response,
      generated_at: new Date().toISOString()
    }
  };
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧠 MCP Insight Generator running on port ${PORT}`);
});
