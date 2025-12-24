/**
 * POST /api/projects/:projectId/apis/:apiId/auto-execute
 * Automatically configure and execute all endpoints
 */
router.post('/:apiId/auto-execute', async (req, res) => {
    try {
        const { projectId, apiId } = req.params;

        console.log(`🚀 Auto-executing API ${apiId}`);

        // Get API with metadata
        const { data: api, error: apiError } = await supabaseAdmin
            .from('discovered_apis')
            .select('*')
            .eq('id', apiId)
            .single();

        if (apiError || !api) {
            return res.status(404).json({ error: 'API not found' });
        }

        // Check if auto-executable
        if (!api.metadata?.auto_executable) {
            return res.status(400).json({
                error: 'API is not auto-executable. Manual configuration required.'
            });
        }

        // Auto-configure with extracted credentials
        const extractedCreds = api.metadata.extracted_credentials;
        if (!extractedCreds) {
            return res.status(400).json({
                error: 'No credentials found in document'
            });
        }

        console.log(`  🔑 Auto-configuring with extracted credentials`);

        // Save configuration
        await supabaseAdmin
            .from('api_configurations')
            .upsert({
                api_id: apiId,
                credentials: extractedCreds,
                is_active: true,
                auto_configured: true
            }, {
                onConflict: 'api_id'
            });

        // Get endpoints
        const { data: endpoints } = await supabaseAdmin
            .from('api_endpoints')
            .select('*')
            .eq('api_id', apiId)
            .order('id');

        if (!endpoints || endpoints.length === 0) {
            return res.status(404).json({ error: 'No endpoints found' });
        }

        console.log(`  📡 Executing ${endpoints.length} endpoints...`);

        // Execute endpoints in sequence
        const results = [];
        let authToken = null;

        for (const endpoint of endpoints) {
            const startTime = Date.now();

            try {
                // Build URL
                let url = `${api.base_url}${endpoint.path}`;

                // Build headers
                const headers = {
                    'Content-Type': 'application/json'
                };

                // Add auth
                if (authToken) {
                    headers['X-Auth-Token'] = authToken;
                } else if (api.auth_type === 'basic' && extractedCreds.username && extractedCreds.password) {
                    const auth = Buffer.from(`${extractedCreds.username}:${extractedCreds.password}`).toString('base64');
                    headers['Authorization'] = `Basic ${auth}`;
                } else if (api.auth_type === 'bearer' && extractedCreds.api_key) {
                    headers['Authorization'] = `Bearer ${extractedCreds.api_key}`;
                }

                // Smart parameter inference
                const params = {};
                if (endpoint.parameters) {
                    for (const param of endpoint.parameters) {
                        // Use auto_value if provided
                        if (param.auto_value) {
                            params[param.name] = param.auto_value;
                        }
                        // Use example if provided
                        else if (param.example) {
                            params[param.name] = param.example;
                        }
                        // Infer from credentials
                        else if (param.name === 'username' || param.name === 'userName') {
                            params[param.name] = extractedCreds.username;
                        }
                        else if (param.name === 'password' || param.name === 'value') {
                            params[param.name] = extractedCreds.password;
                        }
                        else if (param.name === 'grantType') {
                            params[param.name] = 'password';
                        }
                        // For ticket auth
                        else if (param.name === 'ticket' && extractedCreds.ticket) {
                            params[param.name] = extractedCreds.ticket;
                        }
                    }
                }

                // Make request
                let response;
                if (endpoint.method === 'GET') {
                    const queryString = new URLSearchParams(params).toString();
                    url = queryString ? `${url}?${queryString}` : url;

                    console.log(`    📡 GET ${url}`);
                    response = await fetch(url, { headers });
                } else {
                    console.log(`    📡 ${endpoint.method} ${url}`);
                    response = await fetch(url, {
                        method: endpoint.method,
                        headers,
                        body: JSON.stringify(params)
                    });
                }

                const duration = Date.now() - startTime;
                const responseData = await response.text();

                let parsedData;
                try {
                    parsedData = JSON.parse(responseData);
                } catch {
                    parsedData = responseData;
                }

                // Extract token if auth endpoint
                if (endpoint.category === 'auth' && response.ok) {
                    // Try to find token in response
                    if (parsedData.token) authToken = parsedData.token;
                    else if (parsedData.access_token) authToken = parsedData.access_token;
                    else if (parsedData.accessToken) authToken = parsedData.accessToken;
                }

                results.push({
                    endpoint_id: endpoint.id,
                    endpoint_path: endpoint.path,
                    method: endpoint.method,
                    success: response.ok,
                    status_code: response.status,
                    data: parsedData,
                    duration_ms: duration
                });

                // Save to database
                await supabaseAdmin
                    .from('api_data')
                    .insert({
                        project_id: projectId,
                        api_id: apiId,
                        endpoint_id: endpoint.id,
                        data: parsedData,
                        record_count: Array.isArray(parsedData) ? parsedData.length : 1,
                        execution_duration: duration,
                        status: response.ok ? 'success' : 'error'
                    });

                console.log(`    ✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);

            } catch (error) {
                const duration = Date.now() - startTime;
                console.error(`    ❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);

                results.push({
                    endpoint_id: endpoint.id,
                    endpoint_path: endpoint.path,
                    method: endpoint.method,
                    success: false,
                    error: error.message,
                    duration_ms: duration
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`  ✅ Auto-execution completed: ${successCount}/${results.length} successful`);

        res.json({
            message: `Auto-execution completed: ${successCount}/${results.length} successful`,
            results,
            auto_configured: true
        });
    } catch (error) {
        console.error('❌ Auto-execution error:', error);
        res.status(500).json({ error: error.message });
    }
});
