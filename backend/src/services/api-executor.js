import axios from 'axios';

class APIExecutorService {
    async testAPIConnection(baseUrl, authConfig) {
        console.log(`🧪 [EXECUTOR] Testing connection to: ${baseUrl}`);
        try {
            const headers = this.buildAuthHeaders(authConfig);
            const response = await axios.get(baseUrl, { headers, timeout: 15000 });
            return { success: true, status: response.status };
        } catch (error) {
            console.error(`❌ [EXECUTOR] Connection failed:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async executeAPICall(config) {
        const startTime = Date.now();
        console.log(`🚀 [EXECUTOR] Executing ${config.method} ${config.base_url}${config.endpoint}`);

        try {
            const headers = this.buildAuthHeaders({
                type: config.auth_type,
                credentials: config.auth
            });

            const response = await axios({
                method: config.method,
                url: `${config.base_url}${config.endpoint}`,
                headers,
                params: config.params,
                data: config.data,
                timeout: 30000 // Aumentamos el timeout para ejecuciones pesadas
            });

            return {
                success: true,
                data: response.data,
                duration_ms: Date.now() - startTime
            };
        } catch (error) {
            console.error(`❌ [EXECUTOR] API Call error:`, error.message);
            return {
                success: false,
                error: error.message,
                duration_ms: Date.now() - startTime
            };
        }
    }

    async batchExecute(endpoints, auth, projectId) {
        console.log(`📦 [EXECUTOR] Batch executing ${endpoints?.length || 0} endpoints for project ${projectId}`);
        const results = [];
        for (const endpoint of endpoints) {
            const result = await this.executeAPICall({
                ...endpoint,
                auth_type: auth.type,
                auth: auth.credentials
            });
            results.push(result);
        }
        return results;
    }

    buildAuthHeaders(authConfig) {
        const headers = {};
        if (!authConfig) return headers;

        const { type, credentials } = authConfig;
        if (!credentials) return headers;

        try {
            if (type === 'bearer' && credentials.api_key) {
                headers['Authorization'] = `Bearer ${credentials.api_key}`;
            } else if (type === 'api_key' && credentials.api_key) {
                headers['X-API-Key'] = credentials.api_key;
            } else if (type === 'basic' && credentials.username && credentials.password) {
                const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
            } else if (type === 'token' && credentials.token) {
                headers['Authorization'] = `Token ${credentials.token}`;
            } else if (type === 'ticket' && credentials.ticket) {
                // Soporte para Mercado Público Ticket
                headers['Authorization'] = `Ticket ${credentials.ticket}`;
            }
        } catch (err) {
            console.error('⚠️ [EXECUTOR] Error building auth headers:', err.message);
        }

        return headers;
    }
}

export default new APIExecutorService();
