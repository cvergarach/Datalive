import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

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
Analyze this API documentation and extract all available information.
Focus on being comprehensive with ENDPOINTS but CONCISE with schemas.

Extract:
1. All API endpoints with:
   - HTTP method
   - Path/URL
   - Brief description
   - Essential parameters (name, type, required)
   - Simplified response schema (only top-level fields)

2. Authentication methods:
   - Type, Header name, Format

3. Base URL and API metadata.

Return as JSON:
{
  "apis": [{
    "name": "...",
    "description": "...",
    "base_url": "...",
    "auth_type": "...",
    "endpoints": [{
      "method": "...",
      "path": "...",
      "description": "...",
      "parameters": [],
      "response_schema": {"note": "Simplified for token economy"},
      "category": "...",
      "estimated_value": "high"
    }]
  }]
}
`;

  const result = await client.models.generateContent({
    model: modelName,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
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
    const text = result.text;
    console.log('🤖 Gemini Response received, parsing JSON...');
    return JSON.parse(text);
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response as JSON:', parseError);
    console.error('Raw response:', result.text);
    return { apis: [], error: 'Response parsing failed' };
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
