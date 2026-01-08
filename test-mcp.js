// Test script to verify MCP is working
const axios = require('axios');

async function testMCP() {
    try {
        console.log('Testing MCP server...');

        // Test MCP call endpoint
        const response = await axios.post('http://localhost:3001/mcp/call', {
            tool: 'analyze_api_document',
            params: {
                text_content: 'API Documentation: GET /api/v1/users List all users. Requires Basic Auth.',
                project_id: 'test-project',
                mime_type: 'text/plain'
            }
        });

        console.log('MCP Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testMCP();
