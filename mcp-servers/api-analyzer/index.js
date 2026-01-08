import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Increase body size limit for large PDF text content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Models
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const CLAUDE_MODEL_MAP = {
  'haiku': 'claude-3-5-haiku-20241022',
  'sonnet': 'claude-3-5-sonnet-20241022'
};

console.log(`🤖 MCP API Analyzer Starting...`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MCP Tool: Analyze API Documentation
app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'analyze_api_document') {
      const result = await analyzeAPIDocument(
        params.text_content,
        params.project_id,
        params.mime_type,
        params.settings
      );
      return res.json(result);
    }

    if (tool === 'extract_endpoints') {
      const result = await extractEndpoints(params.text_content);
      return res.json(result);
    }

    if (tool === 'extract_auth_methods') {
      const result = await extractAuthMethods(params.text_content);
      return res.json(result);
    }

    res.status(400).json({ error: 'Unknown tool' });
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function analyzeAPIDocument(textContent, projectId, mimeType = 'application/pdf', settings = null) {
  const modelToUse = settings?.ai_model || DEFAULT_GEMINI_MODEL;
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

EXTRACCIÓN DE CREDENCIALES (CRÍTICO):

Busca estos patrones en el documento y extrae los VALORES REALES:
- "Username: admin", "API Key: abc123", "TOKEN = '...'", etc.
- ¡NO uses marcadores como "tu_usuario" o "coloca_aqui_tu_clave"! Extrae lo que diga el documento.

═══════════════════════════════════════════════════════════════

FORMATO DE SALIDA (STRICT JSON):

{
  "apis": [{
    "name": "Nombre Comercial de la API (Ej: Sistema de Gestión de Ventas)",
    "description": "Descripción orientada a negocio (qué valor aporta a la empresa)",
    "base_url": "https://api.ejemplo.com",
    "auth_type": "basic|bearer|api_key|ticket|oauth|token|none",
    "auto_executable": true,
    "extracted_credentials": {
      "username": "valor_real_del_doc",
      "password": "valor_real_del_doc",
      "api_key": "valor_real_del_doc",
      "ticket": "valor_real_del_doc"
    },
    "auth_details": {
      "header_name": "Authorization",
      "format": "Basic base64(usuario:contraseña)",
      "guide": "Guía breve en español para el usuario"
    },
    "execution_strategy": "Plan de ejecución paso a paso orientado a negocio",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/v1/recurso",
        "description": "Nombre funcional en español (Ej: Consultar Inventario Actual)",
        "category": "auth|data_fetch|data_modify|other",
        "estimated_value": "high|medium|low",
        "parameters": [
          {
            "name": "nombre_parametro",
            "type": "string",
            "required": true,
            "description": "Descripción clara en español",
            "example": "valor_del_doc",
            "auto_value": "valor_para_ejecucion_automatica"
          }
        ],
        "execution_order": 1,
        "requires_auth_token": false,
        "execution_steps": "Instrucciones de negocio para usar esta función"
      }
    ]
  }]
}

═══════════════════════════════════════════════════════════════

INSTRUCCIONES ADICIONALES:
- Establece 'auto_executable' como true si encontraste credenciales reales.
- El 'execution_order' debe ser jerárquico (Autenticación primero, luego consultas).
- **PROHIBIDO**: Hablar de "triggers", "request bodies", "JSON syntax" en las descripciones. Habla de "activar proceso", "enviar datos de cliente", "actualizar estado".

RETORNA SOLO JSON VÁLIDO. SIN ETIQUETAS DE MARKDOWN.

COMIENZA EL ANÁLISIS COMERCIAL:`;

  console.log(`📥 Analyzing text content with ${isClaude ? 'Claude' : 'Gemini'} (${effectiveModel})...`);

  const startTime = Date.now();
  let responseText;

  // Internal retry logic for AI Model Overload
  async function callAIWithRetry(retries = 3) {
    let delay = 3000;
    for (let i = 0; i <= retries; i++) {
      try {
        if (isClaude) {
          const message = await anthropic.messages.create({
            model: effectiveModel,
            max_tokens: 8192,
            temperature: 0.4,
            messages: [{
              role: 'user',
              content: `${prompt}\n\nDocument content:\n${textContent}`
            }]
          });
          return message.content[0].text;
        } else {
          const result = await genAI.models.generateContent({
            model: effectiveModel,
            contents: [{
              role: 'user',
              parts: [{ text: `${prompt}\n\nDocument content:\n${textContent}` }]
            }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.4,
            }
          });
          return result.text;
        }
      } catch (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        const isOverloaded = errorMsg.includes('overloaded') ||
          errorMsg.includes('unavailable') ||
          error.status === 503 ||
          error.code === 503 ||
          JSON.stringify(error).includes('503');

        if (i < retries && isOverloaded) {
          console.warn(`⚠️ AI Model Overloaded (${effectiveModel}). Retrying in ${delay}ms... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2.5; // Aggressive exponential backoff
        } else {
          throw error;
        }
      }
    }
  }

  try {
    responseText = await callAIWithRetry();

    const duration = (Date.now() - startTime) / 1000;
    console.log(`🤖 ${isClaude ? 'Claude' : 'Gemini'} Response received in ${duration.toFixed(2)}s!`);

    console.log('🔍 DEBUG - Response length:', responseText?.length || 0);
    console.log('🧹 Cleaning response...');

    // Remove markdown code blocks if present
    let cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Try to parse JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed JSON directly');
    } catch (parseError) {
      console.log('⚠️ Failed to parse, attempting to extract JSON...');

      // Try to find JSON object in the text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedContent = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted and parsed JSON from response');
        } catch (e) {
          console.error('❌ Could not parse extracted JSON:', e.message);
          throw new Error('Failed to parse API analysis response');
        }
      } else {
        console.error('❌ No JSON found in response');
        throw new Error('No valid JSON in API analysis response');
      }
    }

    // Check if we got empty results
    if (!parsedContent.apis || parsedContent.apis.length === 0) {
      console.error('⚠️ WARNING: AI returned empty APIs array!');
    }

    return parsedContent;
  } catch (error) {
    console.error(`❌ ${isClaude ? 'Claude' : 'Gemini'} API Error:`, error);
    throw error;
  }
}

async function extractEndpoints(textContent) {
  return { endpoints: [] };
}

async function extractAuthMethods(textContent) {
  return { auth_methods: [] };
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 MCP API Analyzer is UP and running on port ${PORT}`);
  console.log(`🤖 Listening on 0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
