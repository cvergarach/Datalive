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
  const prompt = `You are an API documentation analyzer. Extract ALL API endpoints and information from this document.

IMPORTANT: Look for:
1. **Base URL**: Usually starts with https://api. or http://
2. **Endpoints**: Paths starting with / (like /v1/customers, /charges, /payments)
3. **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
4. **Authentication**: API keys, Bearer tokens, OAuth, etc.

Common patterns in documentation:
- Endpoints often appear in code examples (curl commands, SDK examples)
- Look for "POST /v1/...", "GET /v1/...", etc.
- Check sections titled: "API Reference", "Endpoints", "Resources", "Methods"
- Parameters are usually in tables or lists

Return JSON in this EXACT format:
{
  "apis": [{
    "name": "API Name (e.g., Stripe API)",
    "description": "Brief description of what this API does",
    "base_url": "https://api.example.com",
    "auth_type": "api_key",
    "auth_details": {"header_name": "Authorization", "format": "Bearer TOKEN", "guide": "How to get API key"},
    "execution_strategy": "How to use this API effectively",
    "endpoints": [{
      "method": "GET",
      "path": "/v1/resource",
      "description": "What this endpoint does",
      "parameters": [{"name": "param", "type": "string", "required": true, "description": "Parameter description"}],
      "response_schema": {"example": "response structure"},
      "category": "data_fetch",
      "estimated_value": "high",
      "execution_steps": "Step-by-step how to call this endpoint"
    }]
  }]
}

CRITICAL: 
- Extract EVERY endpoint you find, even if there are many
- If you see curl examples, extract the endpoint from them
- Don't return empty endpoints array unless there are truly NO API endpoints
- Look carefully through ALL the content

Return {"apis": []} ONLY if absolutely no API information exists.`;


  const result = await client.models.generateContent({
    model: modelName,
    config: {
      maxOutputTokens: 16384, // Increased to prevent truncation
      temperature: 0.2 // Slightly higher to encourage finding more endpoints
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
      console.log('📋 Parsed content:', JSON.stringify(parsed, null, 2));

      // Check if we got empty results
      if (!parsed.apis || parsed.apis.length === 0) {
        console.error('⚠️ WARNING: Gemini returned empty APIs array!');
        console.log('📝 Full response text:', text);
      }

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
