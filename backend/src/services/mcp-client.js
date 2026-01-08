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

  async call(serverName, tool, params = {}, retries = 3) {
    let lastError;
    let delay = 2000; // Start with 2s delay

    for (let i = 0; i <= retries; i++) {
      try {
        return await this._executeCall(serverName, tool, params);
      } catch (error) {
        lastError = error;

        // Determine if error is retryable (Network, 502, 503, 500 or Timeout)
        const isRetryable = !error.response ||
          [500, 502, 503, 504].includes(error.response.status) ||
          error.code === 'ECONNABORTED';

        if (i < retries && isRetryable) {
          console.warn(`⚠️ MCP Call failed (${serverName}.${tool}). Retrying in ${delay}ms... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  async _executeCall(serverName, tool, params = {}) {
    const serverUrl = this.servers[serverName];

    if (!serverUrl) {
      throw new Error(`MCP server '${serverName}' not configured`);
    }

    const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    const targetUrl = `${baseUrl}/mcp/call`;
    console.log(`📡 Calling MCP: ${targetUrl} (tool: ${tool})`);

    try {
      const response = await axios.post(targetUrl, {
        tool,
        params
      }, {
        timeout: 600000, // 10 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error calling MCP ${serverName}.${tool}:`, error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, JSON.stringify(error.response.data));
      }
      throw error; // Rethrow to let call() handle retries
    }
  }

  // API Analyzer Methods
  async analyzeAPIDocument(textContent, projectId, mimeType) {
    let settings = null;
    try {
      // Fetch project settings if projectId is provided
      if (projectId) {
        const { supabaseAdmin } = await import('../config/supabase.js');
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('settings')
          .eq('id', projectId)
          .single();

        if (project?.settings) {
          settings = project.settings;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch project settings for MCP, using defaults:', error.message);
    }

    return this.call('apiAnalyzer', 'analyze_api_document', {
      text_content: textContent,
      project_id: projectId,
      mime_type: mimeType,
      settings: settings // Provide settings to the MCP server
    });
  }

  async extractEndpoints(textContent) {
    return this.call('apiAnalyzer', 'extract_endpoints', {
      text_content: textContent
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
  async generateInsights(projectId, dataContent) {
    const settings = await this._getProjectSettings(projectId);
    return this.call('insightGenerator', 'generate_insights', {
      project_id: projectId,
      data_content: dataContent,
      settings
    });
  }

  async suggestDashboards(projectId, dataContent) {
    const settings = await this._getProjectSettings(projectId);
    return this.call('insightGenerator', 'suggest_dashboards', {
      project_id: projectId,
      data_content: dataContent,
      settings
    });
  }

  async generateReport(projectId, config) {
    const settings = await this._getProjectSettings(projectId);
    return this.call('insightGenerator', 'generate_report', {
      project_id: projectId,
      config,
      settings
    });
  }

  // Helper to fetch settings
  async _getProjectSettings(projectId) {
    if (!projectId) return null;
    try {
      const { supabaseAdmin } = await import('../config/supabase.js');
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single();
      return project?.settings || null;
    } catch (error) {
      console.warn(`⚠️ Error fetching settings for project ${projectId}:`, error.message);
      return null;
    }
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
