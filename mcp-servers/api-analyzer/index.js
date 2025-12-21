import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// MCP Tool: Analyze API Documentation
app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'analyze_api_document') {
      const result = await analyzeAPIDocument(params.gemini_uri, params.project_id);
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

async function analyzeAPIDocument(geminiUri, projectId) {
  const prompt = `
Analyze this API documentation and extract:

1. All API endpoints with:
   - HTTP method (GET, POST, PUT, DELETE, etc.)
   - Path/URL
   - Description
   - Parameters (name, type, required, description)
   - Response schema

2. Authentication methods:
   - Type (Bearer, API Key, OAuth, Basic, etc.)
   - Header name
   - Format

3. Base URL of the API

4. API name and description

Return as JSON with this structure:
{
  "apis": [{
    "name": "API Name",
    "description": "Description",
    "base_url": "https://api.example.com",
    "auth_type": "bearer",
    "auth_details": {},
    "endpoints": [{
      "method": "GET",
      "path": "/endpoint",
      "description": "...",
      "parameters": [],
      "response_schema": {},
      "category": "data_fetch",
      "estimated_value": "high"
    }]
  }]
}
`;

  const result = await model.generateContent([
    {
      fileData: {
        fileUri: geminiUri,
        mimeType: 'application/pdf'
      }
    },
    { text: prompt }
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return { apis: [] };
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
