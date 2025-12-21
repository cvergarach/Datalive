import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MCPClient {
  constructor() {
    this.servers = {
      apiAnalyzer: process.env.MCP_API_ANALYZER_URL,
      apiExecutor: process.env.MCP_API_EXECUTOR_URL,
      insightGenerator: process.env.MCP_INSIGHT_GENERATOR_URL,
      whatsapp: process.env.MCP_WHATSAPP_URL,
      telegram: process.env.MCP_TELEGRAM_URL,
      instagram: process.env.MCP_INSTAGRAM_URL,
    };
  }

  async call(serverName, tool, params = {}) {
    const serverUrl = this.servers[serverName];
    
    if (!serverUrl) {
      throw new Error(`MCP server '${serverName}' not configured`);
    }

    try {
      const response = await axios.post(`${serverUrl}/mcp/call`, {
        tool,
        params
      }, {
        timeout: 120000, // 2 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error calling MCP ${serverName}.${tool}:`, error.message);
      throw new Error(`MCP call failed: ${error.message}`);
    }
  }

  // API Analyzer Methods
  async analyzeAPIDocument(geminiUri, projectId) {
    return this.call('apiAnalyzer', 'analyze_api_document', {
      gemini_uri: geminiUri,
      project_id: projectId
    });
  }

  async extractEndpoints(geminiUri) {
    return this.call('apiAnalyzer', 'extract_endpoints', {
      gemini_uri: geminiUri
    });
  }

  async extractAuthMethods(geminiUri) {
    return this.call('apiAnalyzer', 'extract_auth_methods', {
      gemini_uri: geminiUri
    });
  }

  // API Executor Methods
  async testAPIConnection(baseUrl, authConfig) {
    return this.call('apiExecutor', 'test_api_connection', {
      base_url: baseUrl,
      auth_config: authConfig
    });
  }

  async executeAPICall(config) {
    return this.call('apiExecutor', 'execute_api_call', config);
  }

  async batchExecute(endpoints, auth, projectId) {
    return this.call('apiExecutor', 'batch_execute', {
      endpoints,
      auth,
      project_id: projectId
    });
  }

  // Insight Generator Methods
  async generateInsights(projectId, dataIds) {
    return this.call('insightGenerator', 'generate_insights', {
      project_id: projectId,
      data_ids: dataIds
    });
  }

  async suggestDashboards(projectId, dataSchema) {
    return this.call('insightGenerator', 'suggest_dashboards', {
      project_id: projectId,
      data_schema: dataSchema
    });
  }

  async generateReport(projectId, config) {
    return this.call('insightGenerator', 'generate_report', {
      project_id: projectId,
      config
    });
  }

  // Integration Methods
  async sendWhatsAppMessage(projectId, to, message, context) {
    return this.call('whatsapp', 'send_message', {
      project_id: projectId,
      to,
      message,
      context
    });
  }

  async sendTelegramMessage(projectId, chatId, message, context) {
    return this.call('telegram', 'send_message', {
      project_id: projectId,
      chat_id: chatId,
      message,
      context
    });
  }
}

export default new MCPClient();
