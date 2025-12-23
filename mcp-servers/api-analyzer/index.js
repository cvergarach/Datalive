import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash'; // High-performance latest model

// MCP Tool: Analyze API Documentation
app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'analyze_api_document') {
      const result = await analyzeAPIDocument(params.gemini_uri, params.project_id, params.mime_type);
      return res.json(result);
    }

    if (tool === 'extract_endpoints') {
      const result = await extractEndpoints(params.gemini_uri);
      return res.json(result);
    }

    if (tool === 'extract_auth_methods') {
      const result = await extractAuthMethods(params.gemini_uri);
      return res.json(result);
    }

    res.status(400).json({ error: 'Unknown tool' });
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function analyzeAPIDocument(geminiUri, projectId, mimeType = 'application/pdf') {
  const prompt = `
Act as a world-class API Architect and Documentation Analyst. Your mission is to perform an EXHAUSTIVE discovery of all APIs and endpoints described in this document.

CORE OBJECTIVES:
1. COMPLETE DISCOVERY: Identify EVERY distinct API service mentioned in the documentation.
2. ACTIONABLE ENDPOINTS: Find ALL consumable endpoints (GET, POST, etc.), especially those that provide data, analytics, or search capabilities.
3. SECURITY ANALYST: Extract the PRECISE authentication flow (Type, Header names, Token formats). Providing a "How-to-get-tokens" guide is CRITICAL.
4. EXECUTION ROADMAP: For EACH endpoint, provide a specific "Execution Step" (e.g., "Step 1: Get ID from /v1/projects. Step 2: Use ID in this call").
5. DATA VALUE: Mark endpoints that return the most valuable business data as "high" estimated value.

EXTRACTION GUIDELINES:
- Ignore non-technical sections (marketing, intro, TOS).
- LOOK FOR: Specific URL patterns, cURL examples, Swagger/OpenAPI blocks, and tables of endpoints.
- SEARCH EXHAUSTIVELY: Even if the document is structured poorly, find every URL that looks like an API endpoint.
- Do NOT skip endpoints. Limit to 50 only if the document is excessively technical/repetitive.
- Ensure the base_url is accurate (e.g., https://api.mercadopublico.cl) and includes the protocol.

OUTPUT FORMAT (JSON MUST BE VALID):
{
  "apis": [{
    "name": "Full, professional API name",
    "description": "2-3 sentences explaining exactly what this API does and its main use cases",
    "base_url": "Full base URL including protocol",
    "auth_type": "bearer | api_key | oauth | basic | none",
    "auth_details": {
      "header_name": "e.g., Authorization or x-api-key",
      "format": "e.g., Bearer <token> or YourKeyHere",
      "guide": "Actionable instructions for a user to find/generate their credentials for this specific API"
    },
    "execution_strategy": "A high-level explanation of how to chain these endpoints to generate value",
    "endpoints": [{
      "method": "GET | POST | PUT | DELETE | PATCH",
      "path": "/api/resource",
      "description": "Precise description of what this endpoint returns or affects",
      "parameters": [{"name": "param_name", "type": "string|int|bool", "required": true, "description": "..."}],
      "response_schema": {"note": "Summary of top-level JSON fields"},
      "category": "data_fetch | mutation | analytics | search",
      "estimated_value": "high | medium | low",
      "execution_steps": "Actionable technical requirement (e.g., 'Requires ProjectID as query param')"
    }]
  }]
}
`;

  const result = await client.models.generateContent({
    model: modelName,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
      temperature: 0.0 // Keep it deterministic for extraction
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: geminiUri,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    ]
  });

  try {
    let text = result.text;

    // Clean markdown if present
    if (text.includes('```')) {
      text = text.replace(/```json\n?|```/g, '').trim();
    }

    // Deep Diagnostics
    console.log('🤖 Gemini Response received!');
    console.log('📊 Metadata:', {
      length: text.length,
      finishReason: result.candidates?.[0]?.finishReason,
      usage: result.usageMetadata
    });

    try {
      return JSON.parse(text);
    } catch (innerError) {
      console.error('❌ First JSON parse failed, attempting fuzzy clean...');
      console.log('📝 First 1000 chars of response:', text.slice(0, 1000));
      // Try to find first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        text = text.slice(start, end + 1);
        console.log('🔧 Attempting to parse extracted JSON...');
        return JSON.parse(text);
      }
      throw innerError;
    }
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response as JSON:', parseError);
    console.log('📝 Full response preview (first 1000 chars):', (result.text || '').slice(0, 1000));
    return {
      apis: [],
      error: 'API extraction failed to produce valid data. The document might not contain recognizable API endpoints or the format was too complex.',
      raw: (result.text || '').slice(0, 500)
    };
  }
}

async function extractEndpoints(geminiUri) {
  // Similar implementation
  return { endpoints: [] };
}

async function extractAuthMethods(geminiUri) {
  // Similar implementation
  return { auth_methods: [] };
}

app.listen(PORT, () => {
  console.log(`🤖 MCP API Analyzer running on port ${PORT}`);
});
