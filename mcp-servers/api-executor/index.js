import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
app.use(express.json());

app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, params } = req.body;

    if (tool === 'test_api_connection') {
      const result = await testAPIConnection(params.base_url, params.auth_config);
      return res.json(result);
    }

    if (tool === 'execute_api_call') {
      const result = await executeAPICall(params);
      return res.json(result);
    }

    if (tool === 'batch_execute') {
      const result = await batchExecute(params.endpoints, params.auth, params.project_id);
      return res.json(result);
    }

    res.status(400).json({ error: 'Unknown tool' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function testAPIConnection(baseUrl, authConfig) {
  try {
    const headers = buildAuthHeaders(authConfig);
    const response = await axios.get(baseUrl, { headers, timeout: 10000 });
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeAPICall(config) {
  const startTime = Date.now();
  try {
    const headers = buildAuthHeaders({ type: config.auth_type, credentials: config.auth });
    const response = await axios({
      method: config.method,
      url: `${config.base_url}${config.endpoint}`,
      headers,
      params: config.params,
      data: config.data
    });

    return {
      success: true,
      data: response.data,
      duration_ms: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}

async function batchExecute(endpoints, auth, projectId) {
  const results = [];
  for (const endpoint of endpoints) {
    const result = await executeAPICall({
      ...endpoint,
      auth_type: auth.type,
      auth: auth.credentials
    });
    results.push(result);
  }
  return results;
}

function buildAuthHeaders(authConfig) {
  const headers = {};
  const { type, credentials } = authConfig;

  if (!credentials) return headers;

  if (type === 'bearer' && credentials.api_key) {
    headers['Authorization'] = `Bearer ${credentials.api_key}`;
  } else if (type === 'api_key' && credentials.api_key) {
    headers['X-API-Key'] = credentials.api_key;
  } else if (type === 'basic' && credentials.username && credentials.password) {
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  } else if (type === 'token' && credentials.token) {
    headers['Authorization'] = `Token ${credentials.token}`;
  }

  return headers;
}

app.listen(PORT, () => {
  console.log(`🚀 MCP API Executor running on port ${PORT}`);
});
