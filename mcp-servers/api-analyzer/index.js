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
Analyze this API documentation and extract the information.
Due to document size, focus only on the FIRST 50 ENDPOINTS.
Focus on being comprehensive with ENDPOINTS but CONCISE with schemas.

Extract:
1. Up to 50 API endpoints with:
   - HTTP method
   - Path/URL
   - Brief description
   - Essential parameters
   - Simplified response schema

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
      "response_schema": {"note": "Simplified"},
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
      temperature: 0.1,
      thinkingConfig: {
        includeThoughts: false,
        thinkingBudget: 0
      }
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

    // Deep Diagnostics
    console.log('🤖 Gemini Response received!');
    console.log('📊 Metadata:', {
      length: text.length,
      finishReason: result.candidates?.[0]?.finishReason,
      usage: result.usageMetadata
    });

    if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response was truncated due to token limit (MAX_TOKENS)');
    }

    return JSON.parse(text);
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response as JSON:', parseError);
    // Don't log the whole thing if it's too big, just the end
    const lastPart = result.text.slice(-200);
    console.error('Last 200 characters of response:', lastPart);
    return { apis: [], error: 'Response parsing failed', partial: lastPart };
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
