import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Increase body size limit for large PDF text content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

console.log(`🤖 MCP API Analyzer Starting...`);
console.log(`🤖 Using Gemini model: ${modelName}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: modelName, timestamp: new Date().toISOString() });
});

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
  const prompt = `🚨 CRITICAL TASK: Extract API Configuration for AUTOMATIC EXECUTION 🚨

YOU ARE AN EXPERT API ANALYZER WITH ONE GOAL:
Extract EVERYTHING needed to automatically execute API endpoints WITHOUT user intervention.

═══════════════════════════════════════════════════════════════

WHAT YOU MUST EXTRACT:

1. **BASE URL** - The API endpoint
2. **AUTHENTICATION CREDENTIALS** - Actual values from the document
3. **ENDPOINTS** - All available API endpoints
4. **PARAMETERS** - With example values for auto-execution
5. **EXECUTION SEQUENCE** - Order to execute endpoints

═══════════════════════════════════════════════════════════════

CREDENTIAL EXTRACTION (CRITICAL):

Look for these patterns in the document:

**Python/JavaScript Code:**
- BASE_URL = "https://..." → Extract the URL
- USERNAME = "user123" → Extract the username
- PASSWORD = "pass456" → Extract the password
- API_KEY = "sk_..." → Extract the key
- TOKEN = "..." → Extract the token

**Documentation:**
- "Username: admin" → Extract "admin"
- "API Key: abc123" → Extract "abc123"
- "Example: ticket=xyz" → Extract "xyz"

**IMPORTANT:** Extract the ACTUAL VALUES, not placeholders!

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (STRICT JSON):

{
  "apis": [{
    "name": "API Name",
    "description": "Brief description",
    "base_url": "https://api.example.com",
    "auth_type": "basic|bearer|api_key|ticket|oauth|token|none",
    "auto_executable": true,
    "extracted_credentials": {
      "username": "actual_username_from_doc",
      "password": "actual_password_from_doc",
      "api_key": "actual_key_from_doc",
      "ticket": "actual_ticket_from_doc"
    },
    "auth_details": {
      "header_name": "Authorization",
      "format": "Basic base64(username:password)",
      "guide": "Credentials extracted from document"
    },
    "execution_strategy": "Step-by-step execution plan",
    "endpoints": [
      {
        "method": "GET|POST|PUT|DELETE|PATCH",
        "path": "/v1/resource",
        "description": "What this endpoint does",
        "category": "auth|data_fetch|data_modify|other",
        "estimated_value": "high|medium|low",
        "parameters": [
          {
            "name": "param_name",
            "type": "string",
            "required": true,
            "description": "Parameter description",
            "example": "actual_value_from_doc",
            "auto_value": "value_to_use_for_auto_execution"
          }
        ],
        "execution_order": 1,
        "requires_auth_token": false
      }
    ]
  }]
}

═══════════════════════════════════════════════════════════════

CRITICAL INSTRUCTIONS:

1. **ALWAYS extract actual credential values** from the document
   - If you see USERNAME = "Claro_cvergara_API" → use "Claro_cvergara_API"
   - If you see PASSWORD = "H0men3tw0rk@api" → use "H0men3tw0rk@api"
   - DO NOT use placeholders like "your_username" or "example_password"

2. **Set auto_executable = true** if:
   - You found actual credentials in the document
   - You can infer parameter values
   - The API can be executed without user input

3. **Set execution_order** for endpoints:
   - Auth endpoints should be order 1
   - Data fetch endpoints should be order 2+
   - Endpoints that need tokens should come after auth

4. **Provide auto_value for parameters**:
   - Use example values from the document
   - Use extracted credentials for auth parameters
   - Use common defaults (e.g., "password" for grantType)

5. **Detect auth type correctly**:
   - USERNAME + PASSWORD → "basic"
   - API_KEY or X-API-Key → "api_key"
   - Bearer token → "bearer"
   - ticket parameter → "ticket"
   - TOKEN in headers → "token"

═══════════════════════════════════════════════════════════════

RETURN VALID JSON ONLY. NO MARKDOWN TAGS.

BEGIN ANALYSIS:`;

  console.log('📥 Analyzing text content with Gemini...');
  console.log('🔍 DEBUG - Text content length:', textContent.length);
  console.log('🔍 DEBUG - First 500 chars:', textContent.substring(0, 500));

  const startTime = Date.now();

  try {
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{ text: `${prompt}\n\nDocument content:\n${textContent}` }]
      }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.4,
      }
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`🤖 Gemini Response received in ${duration.toFixed(2)}s!`);

    // Extract text from Gemini response
    const responseText = result.text;

    console.log('🔍 DEBUG - Response length:', responseText?.length || 0);
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
      console.error('⚠️ WARNING: Gemini returned empty APIs array!');
    }

    return parsedContent;
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    throw error;
  }
}

async function extractEndpoints(textContent) {
  // Placeholder for future implementation
  return { endpoints: [] };
}

async function extractAuthMethods(textContent) {
  // Placeholder for future implementation
  return { auth_methods: [] };
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 MCP API Analyzer is UP and running on port ${PORT}`);
  console.log(`🤖 Listening on 0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
