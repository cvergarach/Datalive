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
  const prompt = `You are an expert API documentation analyst. Extract ALL API information from this document.

FIND:
1. Base URL (e.g., https://api.example.com)
2. All endpoints (paths like /v1/users, /products, etc.)
3. HTTP methods (GET, POST, PUT, DELETE)
4. Authentication type (API key, Bearer token, OAuth, etc.)
5. How to get credentials

IMPORTANT:
- Look for URLs starting with http:// or https://
- Look for paths starting with /
- Extract ALL endpoints you find, don't skip any
- If you find authentication info, include it
- Return VALID JSON only

OUTPUT FORMAT (JSON):
{
  "apis": [{
    "name": "API Name from document",
    "description": "What this API does",
    "base_url": "https://api.example.com",
    "auth_type": "api_key",
    "auth_details": {
      "header_name": "ticket",
      "format": "ticket=YOUR_TICKET",
      "guide": "How to get the ticket/key"
    },
    "execution_strategy": "How to use this API effectively",
    "endpoints": [{
      "method": "GET",
      "path": "/v1/resource",
      "description": "What this endpoint does",
      "parameters": [{"name": "param", "type": "string", "required": true, "description": "..."}],
      "response_schema": {"note": "What it returns"},
      "category": "data_fetch",
      "estimated_value": "high",
      "execution_steps": "How to call this endpoint"
    }]
  }]
}

If you cannot find any APIs, return: {"apis": [], "error": "No API endpoints found in document"}
`;

  const result = await client.models.generateContent({
    model: modelName,
    config: {
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

    console.log('🤖 Gemini Response received!');
    console.log('📊 Metadata:', {
      length: text.length,
      finishReason: result.candidates?.[0]?.finishReason,
      usage: result.usageMetadata
    });

    // Clean markdown if present
    if (text.includes('```')) {
      console.log('🧹 Removing markdown code blocks...');
      text = text.replace(/```json\n?|```/g, '').trim();
    }

    // Try direct parse first
    try {
      const parsed = JSON.parse(text);
      console.log('✅ Successfully parsed JSON directly');
      return parsed;
    } catch (innerError) {
      console.error('❌ First JSON parse failed, attempting fuzzy clean...');
      console.log('📝 First 1000 chars of response:', text.slice(0, 1000));

      // Try to find first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        text = text.slice(start, end + 1);
        console.log('🔧 Attempting to parse extracted JSON...');
        const parsed = JSON.parse(text);
        console.log('✅ Successfully parsed after extraction');
        return parsed;
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
