// Test script to verify MCP is working
const axios = require('axios');

async function testMCP() {
    try {
        console.log('Testing MCP server...');

        // Test MCP call endpoint
        const response = await axios.post('http://localhost:3001/mcp/call', {
            method: 'analyze_api_document',
            params: {
                geminiUri: 'https://generativelanguage.googleapis.com/v1beta/files/test',
                projectId: 'test-project',
                mimeType: 'application/pdf'
            }
        });

        console.log('MCP Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testMCP();
