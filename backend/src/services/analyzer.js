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
 * Service to analyze API documentation and extract technical/business details.
 * Consolidates logic previously in mcp-api-analyzer.
 */
class AnalyzerService {
  async analyzeAPIDocument(textContent, projectId, mimeType = 'application/pdf', settings = null) {
    const modelToUse = settings?.ai_model || 'gemini-2.5-flash';
    const isClaude = modelToUse === 'haiku' || modelToUse === 'sonnet';
    const effectiveModel = isClaude ? CLAUDE_MODEL_MAP[modelToUse] : modelToUse;

    const prompt = `🚨 TAREA ESTRATÉGICA: Descubrimiento de Capacidades y Modelos de Negocio 🚨

TU OBJETIVO: Actuar como un Consultor Senior de Negocios y Arquitecto de Soluciones. Debes analizar la documentación no solo para extraer endpoints técnicos, sino para descubrir el VALOR ECONÓMICO oculto en la API.

═══════════════════════════════════════════════════════════════

REGLAS DE IDIOMA Y VISIÓN (ESTRICTO):
1. **IDIOMA**: Todo DEBE estar en ESPAÑOL.
2. **VISIÓN COMERCIAL**: No describas funciones técnicas. Describe SOLUCIONES. 
   - Incorrecto: "Endpoint para listar licitaciones".
   - Correcto: "Motor de Detección de Oportunidades de Venta con el Estado".
3. **IDENTIFICACIÓN DE ORO**: Busca datos que permitan:
   - Ahorrar dinero (Eficiencia).
   - Ganar más dinero (Ventas/Marketing).
   - Evitar riesgos (Compliance/Seguridad).

═══════════════════════════════════════════════════════════════

FORMATO DE SALIDA (STRICT JSON):
{
  "apis": [{
    "name": "Nombre Comercial Impactante",
    "description": "Propuesta de valor clara (ej: 'Plataforma para dominación del mercado público')",
    "base_url": "...",
    "auth_type": "...",
    "business_potential": {
       "score": 1-10,
       "rationale": "Por qué esta API es valiosa para un negocio",
       "key_benefits": ["Beneficio 1", "Beneficio 2"]
    },
    "monetization_ideas": [
       {
         "model": "SaaS / Alertas / Consultoría / etc",
         "description": "Cómo ganar dinero con estos datos",
         "estimated_value": "Alto/Medio/Bajo"
       }
    ],
    "target_audience": "Quién pagaría por esta información (ej: PYMEs, Gerentes comerciales)",
    "execution_strategy": "Plan maestro de negocio para usar esta API",
    "endpoints": [
      {
        "method": "...",
        "path": "...",
        "description": "Nombre de la Capacidad de Negocio",
        "category": "auth|data_fetch|data_modify|other",
        "business_value": "Describir el impacto financiero o de eficiencia de este endpoint específico",
        "potential_alerts": ["Alerta que se podría crear con estos datos (ej: 'Avisar si precio baja un 10%')"],
        "parameters": [ ... ],
        "execution_steps": "Guía táctica para el usuario"
      }
    ]
  }]
}

RETORNA SOLO JSON VÁLIDO. SIN ETIQUETAS DE MARKDOWN.`;

    console.log(`🧠 [ANALYZER] Processing document for project ${projectId} using ${effectiveModel}`);

    try {
      let responseText;
      const maxRetries = 2;
      let lastError;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          if (isClaude) {
            const message = await anthropic.messages.create({
              model: effectiveModel,
              max_tokens: 8192,
              temperature: 0.4,
              messages: [{ role: 'user', content: `${prompt}\n\nDocument content:\n${textContent}` }]
            });
            responseText = message.content[0].text;
          } else {
            const result = await genAI.models.generateContent({
              model: effectiveModel,
              contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nDocument content:\n${textContent}` }] }],
              generationConfig: { maxOutputTokens: 8192, temperature: 0.4 }
            });
            responseText = result.text;
          }
          break; // Success
        } catch (error) {
          lastError = error;
          if (i < maxRetries && (error.message.includes('overloaded') || error.status === 503)) {
            console.warn(`⚠️ [ANALYZER] Model overloaded. Retrying... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
            continue;
          }
          throw error;
        }
      }

      // Cleanup response
      let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [ANALYZER] No JSON match. Raw response:', responseText);
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ [ANALYZER] Analysis complete. Discovered ${parsed.apis?.length || 0} APIs.`);
      return parsed;
    } catch (error) {
      console.error(`❌ [ANALYZER] Critical Error:`, error.message);
      throw error;
    }
  }
}

export default new AnalyzerService();
