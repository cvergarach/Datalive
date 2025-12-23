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
  const prompt = `You are an expert API documentation analyzer. Your ONLY job is to find and extract API endpoints.

STEP 1: Find the Base URL
Look for patterns like:
- "https://api.stripe.com"
- "Base URL: https://api.example.com"
- In curl examples: curl https://api.stripe.com/v1/charges

STEP 2: Find ALL Endpoints
Endpoints look like this in documentation:
- "POST /v1/customers" 
- "GET /v1/charges/:id"
- "DELETE /v1/subscriptions/{subscription_id}"
- curl -X POST https://api.stripe.com/v1/payment_intents
- stripe.customers.create() → maps to POST /v1/customers
- stripe.charges.retrieve(id) → maps to GET /v1/charges/:id

WHERE TO LOOK:
1. Section titles: "API Reference", "Endpoints", "Resources", "REST API"
2. Code examples (curl, Python, JavaScript, Ruby)
3. Tables with "Method" and "Endpoint" columns
4. Lists of operations like "Create a customer", "Retrieve a charge"

EXAMPLE INPUT:
"Create a customer: POST /v1/customers
Retrieve a customer: GET /v1/customers/:id
List all customers: GET /v1/customers"

EXAMPLE OUTPUT:
{
  "apis": [{
    "name": "Stripe API",
    "base_url": "https://api.stripe.com",
    "endpoints": [
      {"method": "POST", "path": "/v1/customers", "description": "Create a customer"},
      {"method": "GET", "path": "/v1/customers/:id", "description": "Retrieve a customer"},
      {"method": "GET", "path": "/v1/customers", "description": "List all customers"}
    ]
  }]
}

RETURN FORMAT (STRICT JSON):
{
  "apis": [{
    "name": "API Name",
    "description": "What this API does",
    "base_url": "https://api.example.com",
    "auth_type": "api_key",
    "auth_details": {"header_name": "Authorization", "format": "Bearer TOKEN"},
    "execution_strategy": "How to use this API",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/v1/resource",
        "description": "What this endpoint does",
        "parameters": [{"name": "id", "type": "string", "required": true}],
        "response_schema": {},
        "category": "data_fetch",
        "estimated_value": "high",
        "execution_steps": "How to call it"
      }
    ]
  }]
}

CRITICAL RULES:
1. You MUST extract at least 5-10 endpoints if they exist
2. If you see "Create", "Retrieve", "Update", "Delete", "List" → those are endpoints
3. Look for HTTP methods (GET, POST, PUT, DELETE, PATCH) followed by paths
4. Check EVERY code example for endpoint paths
5. DO NOT return empty endpoints:[] unless there are ZERO API endpoints in the entire document

NOW ANALYZE THE DOCUMENT AND EXTRACT ALL ENDPOINTS.`;



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
