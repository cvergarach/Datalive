import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Claude client
const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Model selection via environment variable
// CLAUDE_MODEL=haiku (cheap, fast) or CLAUDE_MODEL=sonnet (expensive, better)
const MODEL_MAP = {
  'haiku': 'claude-3-5-haiku-20241022',    // $1 per 1M input tokens, $5 per 1M output
  'sonnet': 'claude-3-5-sonnet-20241022'   // $3 per 1M input tokens, $15 per 1M output
};

const selectedModel = process.env.CLAUDE_MODEL || 'haiku'; // Default to cheaper model
const modelName = MODEL_MAP[selectedModel];

console.log(`🤖 Using Claude model: ${selectedModel} (${modelName})`);

// MCP Tool: Analyze API Documentation
app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'analyze_api_document') {
      const result = await analyzeAPIDocument(params.text_content, params.project_id, params.mime_type);
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

async function analyzeAPIDocument(textContent, projectId, mimeType = 'application/pdf') {
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


  console.log('📥 Analyzing text content with Claude...');
  console.log('🔍 DEBUG - Text content length:', textContent.length);
  console.log('🔍 DEBUG - First 500 chars:', textContent.substring(0, 500));

  const result = await claude.messages.create({
    model: modelName,
    max_tokens: 8192,
    temperature: 0.4,
    messages: [{
      role: 'user',
      content: `${prompt}\n\nDocument content:\n${textContent}`
    }]
  });

  console.log('🤖 Claude Response received!');
  console.log('📊 Metadata:', {
    model: result.model,
    stopReason: result.stop_reason,
    usage: result.usage
  });

  // Extract text from Claude response
  const responseText = result.content[0].text;

  console.log('🔍 DEBUG - Response length:', responseText.length);
  console.log('🔍 DEBUG - Full response:', responseText);
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

  console.log('📋 Parsed content:', JSON.stringify(parsedContent, null, 2));

  // Check if we got empty results
  if (!parsedContent.apis || parsedContent.apis.length === 0) {
    console.error('⚠️ WARNING: Claude returned empty APIs array!');
  }

  return parsedContent;
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
