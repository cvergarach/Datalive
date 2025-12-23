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
Act as an expert API Architect and Security Researcher. Your goal is to DISCOVER and ANALYZE all consumable endpoints in this documentation to enable automated data extraction.

INSTRUCTIONS:
1. DOCUMENT REVIEW: Scan the entire document to find ALL distinct APIs.
2. AUTHENTICATION INTELLIGENCE: 
   - Identify EXACTLY how to authenticate (Auth Type, Header Name, Token Format).
   - Provide a "Auth Setup Guide" for humans (e.g., "Go to dashboard -> Keys -> Copy API Key").
3. ENDPOINT DISCOVERY:
   - Find ALL consumable endpoints, especially those returning data (GET), Search, or Analytics.
   - For EACH endpoint, devise a "Execution Plan": specific sequence of calls or parameter requirements to get data successfully.
4. ACTIONABLE INTELLIGENCE:
   - Categorize by business value (e.g., Inventory, Pricing, Customers).
   - Identify dependencies between endpoints (e.g., "Must call /login first to get token").

OUTPUT FORMAT (JSON ONLY):
{
  "apis": [{
    "name": "Professional name of the API",
    "description": "Comprehensive summary of capabilities",
    "base_url": "e.g., https://api.example.com/v1",
    "auth_type": "bearer | api_key | oauth | basic | none",
    "auth_details": {
      "header_name": "Authorization",
      "format": "Bearer <token>",
      "guide": "Step-by-step instructions to get credentials"
    },
    "execution_strategy": "Overall strategy to consume this API effectively",
    "endpoints": [{
      "method": "GET | POST | etc",
      "path": "/users",
      "description": "What this endpoint specifically provides",
      "parameters": [{"name": "...", "type": "...", "required": true, "description": "..."}],
      "response_schema": {"note": "Summary of key fields returned"},
      "category": "data_fetch | analytics | search | admin",
      "estimated_value": "high | medium | low",
      "execution_steps": "Actionable steps to successfully call this endpoint (e.g., '1. Obtain project_id from /projects, 2. Pass as query param')"
    }]
  }]
}

LIMIT: Focus on the most VALUABLE 50 endpoints if the document is massive.
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
