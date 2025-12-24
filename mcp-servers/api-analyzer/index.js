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
  const prompt = `🚨 CRITICAL TASK: Extract API Endpoints from Documentation 🚨

YOU ARE AN EXPERT API DOCUMENTATION ANALYZER.
YOUR SUCCESS IS MEASURED BY HOW MANY ENDPOINTS YOU EXTRACT.
RETURNING EMPTY endpoints:[] IS A FAILURE.

═══════════════════════════════════════════════════════════════

WHAT YOU'RE LOOKING FOR:

1. BASE URL - Examples:
   ✓ "https://api.stripe.com"
   ✓ "Base URL: https://api.example.com/v1"
   ✓ Found in curl: curl https://api.stripe.com/v1/charges

2. ENDPOINTS - They look like this:
   ✓ "POST /v1/customers"
   ✓ "GET /v1/charges/:id"
   ✓ "DELETE /v1/subscriptions/{id}"
   ✓ curl -X POST https://api.stripe.com/v1/payment_intents
   ✓ stripe.customers.create() → POST /v1/customers
   ✓ stripe.charges.retrieve(id) → GET /v1/charges/:id
   ✓ "Create a customer" → POST /v1/customers
   ✓ "List all invoices" → GET /v1/invoices

3. WHERE TO LOOK:
   📍 Section headers: "API Reference", "Endpoints", "Resources"
   📍 Code blocks: curl, Python, JavaScript, Ruby examples
   📍 Tables with columns: "Method", "Endpoint", "Description"
   📍 Lists: "Create X", "Retrieve X", "Update X", "Delete X", "List X"
   📍 Navigation menus: Often list all resources
   📍 URL patterns in text: /v1/..., /api/..., /resource/...

═══════════════════════════════════════════════════════════════

REAL EXAMPLE FROM STRIPE:

INPUT TEXT:
"The Stripe API is organized around REST. You can use the API in test mode.

Create a customer
POST /v1/customers

Retrieve a customer  
GET /v1/customers/:id

List all customers
GET /v1/customers

Create a charge
POST /v1/charges

curl https://api.stripe.com/v1/customers \\
  -u sk_test_123:

stripe.customers.create()"

YOUR OUTPUT MUST BE:
{
  "apis": [{
    "name": "Stripe API",
    "base_url": "https://api.stripe.com",
    "endpoints": [
      {"method": "POST", "path": "/v1/customers", "description": "Create a customer"},
      {"method": "GET", "path": "/v1/customers/:id", "description": "Retrieve a customer"},
      {"method": "GET", "path": "/v1/customers", "description": "List all customers"},
      {"method": "POST", "path": "/v1/charges", "description": "Create a charge"}
    ]
  }]
}

═══════════════════════════════════════════════════════════════

EXTRACTION ALGORITHM:

STEP 1: Scan for HTTP methods
→ Search for: GET, POST, PUT, DELETE, PATCH, OPTIONS
→ Look 5 words before and after for paths starting with /

STEP 2: Scan for common patterns
→ "Create a X" = POST /v1/x
→ "Retrieve X" = GET /v1/x/:id  
→ "List X" = GET /v1/x
→ "Update X" = PUT /v1/x/:id
→ "Delete X" = DELETE /v1/x/:id

STEP 3: Extract from code examples
→ Find all curl commands
→ Extract URL and method
→ Find all SDK calls (stripe.X.Y())
→ Map to REST endpoints

STEP 4: Check tables
→ Look for tables with "Endpoint" or "URL" columns
→ Extract method + path from each row

STEP 5: Validate
→ Did you find at least 5 endpoints?
→ NO? Go back and look harder!
→ YES? Proceed to output

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (STRICT JSON):

{
  "apis": [{
    "name": "API Name (e.g., Stripe API)",
    "description": "Brief description",
    "base_url": "https://api.example.com",
    "auth_type": "api_key|bearer|basic|oauth|none",
    "auth_details": {
      "header_name": "Authorization",
      "format": "Bearer TOKEN",
      "guide": "How to get credentials"
    },
    "execution_strategy": "How to use this API",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/v1/resource",
        "description": "What this endpoint does",
        "parameters": [
          {"name": "id", "type": "string", "required": true, "description": "Resource ID"}
        ],
        "response_schema": {"example": "response"},
        "category": "data_fetch|data_modify|auth|other",
        "estimated_value": "high|medium|low",
        "execution_steps": "Step by step how to call"
      }
    ]
  }]
}

═══════════════════════════════════════════════════════════════

🚨 CRITICAL SUCCESS CRITERIA:

✅ MINIMUM 10 endpoints extracted (if documentation has them)
✅ Each endpoint has method + path
✅ Base URL identified
✅ Auth type detected

❌ FAILURE CONDITIONS:
❌ Returning {"apis": []} when endpoints exist
❌ Returning endpoints:[] when documentation clearly has endpoints
❌ Extracting fewer than 5 endpoints from comprehensive docs
❌ Missing obvious endpoints mentioned in titles/headers

═══════════════════════════════════════════════════════════════

SPECIAL INSTRUCTIONS:

1. If you see "API Reference" section → EXTRACT EVERYTHING FROM IT
2. If you see curl examples → EXTRACT THE ENDPOINT
3. If you see SDK calls → CONVERT TO REST ENDPOINT
4. If you see "Create/Retrieve/Update/Delete/List" → IT'S AN ENDPOINT
5. If unsure about a path → INCLUDE IT (better to have false positives)

6. For Stripe specifically:
   - Look for /v1/customers, /v1/charges, /v1/payment_intents
   - Look for /v1/invoices, /v1/subscriptions, /v1/products
   - Look for /v1/prices, /v1/coupons, /v1/refunds

7. For any API:
   - Common patterns: /api/v1/..., /v1/..., /v2/...
   - Resources are usually plural: /users, /products, /orders
   - Detail endpoints have :id or {id}: /users/:id

═══════════════════════════════════════════════════════════════

NOW ANALYZE THE DOCUMENT BELOW.
EXTRACT EVERY SINGLE ENDPOINT YOU CAN FIND.
DO NOT SKIP ANY.
RETURN VALID JSON ONLY.

BEGIN ANALYSIS:`;



  const result = await client.models.generateContent({
    model: modelName,
    config: {
      maxOutputTokens: 16384, // Increased to prevent truncation
      temperature: 0.4 // Higher temperature to encourage aggressive endpoint extraction
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
