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

    const prompt = `📊 TAREA: Generación de Inteligencia Estratégica (Persona: Senior Strategy Consultant) 📊
        
Transforma estos datos crudos en una brújula de decisiones para la alta gerencia. No reportes datos, reporta IMPACTO.

REGLAS DE ORO:
1. **PERSONA**: Actúa como un consultor de McKinsey/BCG. Tu lenguaje es ejecutivo, sobrio y enfocado en rentabilidad.
2. **TEMAS CLAVE**: 
   - **Arbitraje**: ¿Dónde estamos comprando caro o vendiendo barato?
   - **Riesgo**: ¿Qué patrón indica que vamos a perder un contrato o cliente?
   - **Crecimiento**: ¿Dónde hay un "océano azul" no explotado?
3. **TONO**: 100% Español, sin tecnicismos de software.

FORMATO JSON:
{
  "insights": [
    {
      "type": "opportunity|risk|efficiency|arbitrage",
      "title": "Conclusión Estratégica",
      "description": "Análisis profundo del impacto",
      "financial_impact": "Estimación de monto o % de ahorro/ganancia",
      "confidence": 0.95,
      "strategic_priority": "Alta/Media/Baja",
      "actionable_next_step": "Acción inmediata para el CEO/Gerente"
    }
  ]
}`;

    console.log(`🧠 [INSIGHTS] Generating strategic insights for project ${projectId} using ${effectiveModel}`);
    return this._callAI(prompt, JSON.stringify(dataContent), isClaude, effectiveModel);
  }

  async suggestDashboards(projectId, dataContent, settings = null) {
    const modelToUse = settings?.ai_model || 'gemini-2.5-flash';
    const isClaude = modelToUse === 'haiku' || modelToUse === 'sonnet';
    const effectiveModel = isClaude ? CLAUDE_MODEL_MAP[modelToUse] : modelToUse;

    const prompt = `📊 TAREA: Diseño de Cockpit Ejecutivo (Dashboard de Control Total) 📊
        
Diseña una interfaz de control basada en datos reales. Cada widget debe responder a la pregunta: "¿Estamos ganando o perdiendo dinero?"

REGLAS:
1. **SIN PLACEHOLDERS**: Usa los datos reales del adjunto.
2. **WIDGETS DE IMPACTO**:
   - 'stat': Para KPIs críticos.
   - 'bar/line': Para tendencias de mercado o competencia.
   - 'pie': Para cuota de mercado o distribución de gasto.
3. **LOGICA DE NEGOCIO**: Si ves datos de Mercado Público, enfócate en 'Tasa de Adjudicación', 'Ranking de Competidores' o 'Proyección de Gasto'.

FORMATO JSON:
{
  "dashboards": [
    {
      "title": "Panel de Control Estratégico",
      "widgets": [
        {
          "type": "bar|line|pie|stat",
          "title": "Título Ejecutivo (ej: Eficiencia de Adjudicación)",
          "description": "Explicación de la métrica de negocio",
          "data": [ ... ],
          "current_value": "valor", 
          "trend": "+X% vs mes anterior",
          "insight_label": "Breve conclusión del gráfico"
        }
      ]
    }
  ]
}

REGLAS TÉCNICAS:
- 'data' debe ser un array de objetos {label, value}.
- Si faltan datos, proyecta linealmente basado en la tendencia.`;

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
