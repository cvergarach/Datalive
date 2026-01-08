import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

dotenv.config();

const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not found in environment variables');
}

const claude = new Anthropic({ apiKey });

// Model selection via environment variable
const MODEL_MAP = {
    'haiku': 'claude-3-5-haiku-20241022',
    'sonnet': 'claude-3-5-sonnet-20241022'
};

const selectedModel = process.env.CLAUDE_MODEL || 'haiku';
const modelName = MODEL_MAP[selectedModel];

console.log(`🤖 Claude Service initialized with model: ${selectedModel} (${modelName})`);

class ClaudeService {
    constructor() {
        this.model = modelName;
    }

    /**
     * Extract text from PDF file
     */
    async extractTextFromPDF(filePath) {
        try {
            console.log(`📄 Extracting text from PDF: ${filePath}`);

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            console.log(`✅ Text extracted: ${data.text.length} characters, ${data.numpages} pages`);

            return {
                text: data.text,
                numPages: data.numpages,
                info: data.info
            };
        } catch (error) {
            console.error('❌ Error extracting text from PDF:', error);
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    /**
     * Analyze text with Claude
     */
    async analyzeText(text, prompt, projectId = null) {
        let modelToUse = this.model;

        try {
            if (projectId) {
                const { supabaseAdmin } = await import('../config/supabase.js');
                const { data: project } = await supabaseAdmin
                    .from('projects')
                    .select('settings')
                    .eq('id', projectId)
                    .single();

                if (project?.settings?.ai_model && MODEL_MAP[project.settings.ai_model]) {
                    modelToUse = MODEL_MAP[project.settings.ai_model];
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch project settings for Claude, using default model:', error.message);
        }

        try {
            console.log(`🤖 Analyzing text with Claude (${modelToUse})...`);

            const message = await claude.messages.create({
                model: modelToUse,
                max_tokens: 8192,
                temperature: 0.4,
                messages: [{
                    role: 'user',
                    content: `${prompt}\n\nDocument content:\n${text}`
                }]
            });

            const responseText = message.content[0].text;

            console.log(`✅ Claude analysis complete. Response length: ${responseText.length}`);

            return responseText;
        } catch (error) {
            console.error('❌ Error analyzing with Claude:', error);
            throw new Error(`Failed to analyze with Claude: ${error.message}`);
        }
    }

    /**
     * Get MIME type from file extension
     */
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.html': 'text/html',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.json': 'application/json'
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }
}

export default new ClaudeService();
