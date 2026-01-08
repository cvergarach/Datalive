import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const CLAUDE_MODEL_MAP = {
  'haiku': 'claude-3-5-haiku-20241022',
  'sonnet': 'claude-3-5-sonnet-20241022'
};

/**
 * Service to generate high-level dashboards and commercial insights.
 * Consolidates logic previously in mcp-insight-generator.
 */
class InsightGeneratorService {
  async generateInsights(projectId, dataContent, settings = null) {
    const modelToUse = settings?.ai_model || 'gemini-2.5-flash';
    const isClaude = modelToUse === 'haiku' || modelToUse === 'sonnet';
    const effectiveModel = isClaude ? CLAUDE_MODEL_MAP[modelToUse] : modelToUse;

    const prompt = `📊 TAREA: Generar Insights Estratégicos de Negocio 📊
        
Tienes los siguientes datos provenientes de ejecuciones de API. Tu objetivo es transformarlos en 3-5 INSIGHTS CLAVE para un ejecutivo de nivel C.

REGLAS DE ORO:
1. **IDIOMA**: 100% ESPAÑOL.
2. **VALOR COMERCIAL**: No menciones JSON, endpoints o estados HTTP. Habla de eficiencia, ahorro, riesgos, clientes, ventas.
3. **ACCIONABLE**: Cada insight debe llevar una acción clara recomendada.

FORMATO JSON:
{
  "insights": [
    {
      "type": "opportunity|risk|efficiency|growth",
      "title": "Título impacto",
      "description": "Explicación breve",
      "confidence": 0-1,
      "actionable_next_step": "Qué debe hacer el gerente ahora mismo"
    }
  ]
}`;

    console.log(`🧠 [INSIGHTS] Generating insights for project ${projectId} using ${effectiveModel}`);
    return this._callAI(prompt, JSON.stringify(dataContent), isClaude, effectiveModel);
  }

  async suggestDashboards(projectId, dataContent, settings = null) {
    const modelToUse = settings?.ai_model || 'gemini-2.5-flash';
    const isClaude = modelToUse === 'haiku' || modelToUse === 'sonnet';
    const effectiveModel = isClaude ? CLAUDE_MODEL_MAP[modelToUse] : modelToUse;

    const prompt = `📊 TAREA: Diseñar Dashboard Ejecutivo con DATOS REALES 📊
        
Crea una propuesta de dashboard basada en los datos adjuntos. NO USES PLACEHOLDERS. Extrae los valores reales de los datos proporcionados para cada widget.

FORMATO JSON:
{
  "dashboards": [
    {
      "title": "Nombre del Tablero",
      "widgets": [
        {
          "type": "bar|line|pie|stat",
          "title": "Título de la Métrica",
          "description": "Explicación de qué estamos viendo",
          "data": [
            { "label": "Enero", "value": 150 },
            { "label": "Febrero", "value": 200 }
          ],
          "current_value": "200", 
          "trend": "+15%",
          "visual_config": { "color": "blue" }
        }
      ]
    }
  ]
}

REGLAS:
1. Extrae los datos del 'Dato de entrada' adjunto.
2. Si es un 'stat', proporciona un 'current_value'.
3. Si es un gráfico, proporciona un array 'data' con al menos 3 puntos.
4. Si no hay suficientes datos, crea una proyección realista basada en la tendencia detectada.`;

    console.log(`📊 [DASHBOARDS] Suggesting dashboards for project ${projectId} using ${effectiveModel}`);
    return this._callAI(prompt, JSON.stringify(dataContent), isClaude, effectiveModel);
  }

  async _callAI(prompt, context, isClaude, model) {
    try {
      let responseText;
      const maxRetries = 2;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          if (isClaude) {
            const message = await anthropic.messages.create({
              model: model,
              max_tokens: 4096,
              temperature: 0.3,
              messages: [{ role: 'user', content: `${prompt}\n\nDato de entrada:\n${context}` }]
            });
            responseText = message.content[0].text;
          } else {
            const result = await genAI.models.generateContent({
              model: model,
              contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nDato de entrada:\n${context}` }] }],
              generationConfig: { maxOutputTokens: 4096, temperature: 0.3 }
            });
            responseText = result.text;
          }
          if (!responseText) throw new Error('AI returned empty response');
          break;
        } catch (error) {
          if (i < maxRetries && (error.message.includes('overloaded') || error.status === 503)) {
            console.warn(`⚠️ [INSIGHTS] Model overloaded. Retrying... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
            continue;
          }
          throw error;
        }
      }

      const jsonMatch = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in insight response');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`❌ [INSIGHTS/INTERNAL] Error:`, error.message);
      throw error;
    }
  }
}

export default new InsightGeneratorService();
