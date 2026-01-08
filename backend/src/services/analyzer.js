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

    const prompt = `🚨 TAREA CRÍTICA: Extraer Configuración de API para EJECUCIÓN AUTOMÁTICA 🚨

TU OBJETIVO: Extraer TODA la información necesaria para ejecutar los endpoints de la API SIN intervención del usuario, presentando la información en un lenguaje COMERCIAL y de NEGOCIO.

═══════════════════════════════════════════════════════════════

REGLAS DE IDIOMA Y TONO (ESTRICTO):
1. **IDIOMA**: Todo el contenido generado (nombres, descripciones, estrategias) DEBE estar en ESPAÑOL.
2. **TONO COMERCIAL**: No uses lenguaje técnico. En lugar de "GET /api/v1/customers", usa "Consultar Cartera de Clientes". En lugar de "Parámetros de cabecera", usa "Datos de Acceso".
3. **VALOR DE NEGOCIO**: Las descripciones deben explicar QUÉ hace la funcionalidad para la empresa. Ej: "Permite obtener el listado de facturas pendientes para gestión de cobranza".

═══════════════════════════════════════════════════════════════

QUÉ DEBES EXTRAER:
1. **URL BASE** - El punto de entrada de la API.
2. **CREDENCIALES DE AUTENTICACIÓN** - Valores reales encontrados en el documento.
3. **ENDPOINTS (FUNCIONALIDADES)** - Todas las capacidades disponibles.
4. **PARÁMETROS** - Con valores de ejemplo para ejecución automática.
5. **ESTRATEGIA DE EJECUCIÓN** - Orden lógico para usar las funciones.

═══════════════════════════════════════════════════════════════

FORMATO DE SALIDA (STRICT JSON):
{
  "apis": [{
    "name": "Nombre Comercial de la API",
    "description": "Descripción orientada a negocio",
    "base_url": "https://api.ejemplo.com",
    "auth_type": "basic|bearer|api_key|ticket|oauth|token|none",
    "auto_executable": true,
    "extracted_credentials": { ... },
    "auth_details": {
      "header_name": "Authorization",
      "format": "Basic base64(usuario:contraseña)",
      "guide": "Guía breve en español"
    },
    "execution_strategy": "Plan de ejecución paso a paso",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE",
        "path": "/v1/recurso",
        "description": "Nombre funcional en español",
        "category": "auth|data_fetch|data_modify|other",
        "estimated_value": "high|medium|low",
        "parameters": [
          {
            "name": "name",
            "type": "string",
            "required": true,
            "description": "...",
            "example": "...",
            "auto_value": "..."
          }
        ],
        "execution_order": 1,
        "execution_steps": "Instrucciones de negocio"
      }
    ]
  }]
}

RETORNA SOLO JSON VÁLIDO. SIN ETIQUETAS DE MARKDOWN.`;

    console.log(`🧠 [ANALYZER] Processing document for project ${projectId} using ${effectiveModel}`);

    try {
      let responseText;
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

      // Cleanup response
      let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ [ANALYZER] Analysis complete. Discovered ${parsed.apis?.length || 0} APIs.`);
      return parsed;
    } catch (error) {
      console.error(`❌ [ANALYZER] Error:`, error.message);
      throw error;
    }
  }
}

export default new AnalyzerService();
