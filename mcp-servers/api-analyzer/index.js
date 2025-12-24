import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Increase body size limit for large PDF text content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const prompt = `🚨 CRITICAL TASK: Extract API Configuration from Documentation or Source Code 🚨

YOU ARE AN EXPERT API ANALYZER.
YOUR GOAL: Extract API endpoints, authentication details, and configuration examples.

═══════════════════════════════════════════════════════════════

WHAT YOU'RE ANALYZING:

1. **API Documentation** (PDFs, markdown, HTML)
2. **Source Code** (Python, JavaScript, etc.) that calls APIs

═══════════════════════════════════════════════════════════════

EXTRACTION RULES:

1. **BASE URL** - Look for:
   ✓ BASE_URL = "https://..."
   ✓ base_url: "https://..."
   ✓ API_ENDPOINT = "https://..."
   ✓ In curl: curl https://api.example.com/v1/...

2. **AUTHENTICATION** - Detect type from code:
   ✓ USERNAME + PASSWORD → auth_type: "basic"
   ✓ API_KEY or TOKEN → auth_type: "bearer" or "api_key"
   ✓ ticket parameter → auth_type: "ticket"
   ✓ OAuth client_id/secret → auth_type: "oauth"

3. **CREDENTIALS EXAMPLES** - Extract from code:
   ✓ USERNAME = "example_user" → Include in auth_details.example
   ✓ PASSWORD = "example_pass" → Include in auth_details.example
   ✓ API_KEY = "sk_test_..." → Include in auth_details.example

4. **ENDPOINTS** - Extract from:
   ✓ requests.get(f"{BASE_URL}/endpoint") → GET /endpoint
   ✓ fetch(\`\${API_URL}/users\`) → GET /users
   ✓ curl -X POST https://api.com/v1/create → POST /v1/create

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (STRICT JSON):

{
  "apis": [{
    "name": "API Name",
    "description": "Brief description",
    "base_url": "https://api.example.com",
    "auth_type": "basic|bearer|api_key|ticket|oauth|none",
    "auth_details": {
      "header_name": "Authorization",
      "format": "Basic base64(username:password)",
      "guide": "How to get credentials",
      "example": {
        "username": "example_user",
        "password": "example_pass"
      }
    },
    "execution_strategy": "How to use this API",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/v1/resource",
        "description": "What this endpoint does",
        "parameters": [
          {"name": "id", "type": "string", "required": true, "description": "Resource ID", "example": "12345"}
        ],
        "response_schema": {"example": "response"},
        "category": "data_fetch|data_modify|auth|other",
        "estimated_value": "high|medium|low"
      }
    ]
  }]
}

═══════════════════════════════════════════════════════════════

CRITICAL INSTRUCTIONS:

1. **If analyzing SOURCE CODE**:
   - Extract BASE_URL, API_ENDPOINT, or similar constants
   - Detect auth type from USERNAME/PASSWORD, API_KEY, TOKEN variables
   - Find all HTTP requests (requests.get, fetch, axios, curl)
   - Extract endpoint paths from request URLs
   - Include example credentials found in code (sanitize if needed)

2. **If analyzing DOCUMENTATION**:
   - Look for "API Reference", "Endpoints", "Authentication" sections
   - Extract curl examples
   - Find endpoint tables
   - Get authentication instructions

3. **ALWAYS include**:
   - auth_details.example with sample values (from code or docs)
   - parameters with example values
   - Clear guide on how to configure

═══════════════════════════════════════════════════════════════

NOW ANALYZE THE CONTENT BELOW.
EXTRACT ALL API CONFIGURATION AND ENDPOINTS.
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
