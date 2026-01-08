import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';
import { GoogleGenAI } from '@google/genai';
import { Anthropic } from '@anthropic-ai/sdk';

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);

/**
 * GET /api/projects/:projectId/chats
 */
router.get('/', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { data: chats, error } = await supabaseAdmin
            .from('chats')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ chats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/projects/:projectId/chats
 */
router.post('/', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name } = req.body;
        const userId = req.user.id;

        const { data: chat, error } = await supabaseAdmin
            .from('chats')
            .insert({
                project_id: projectId,
                name: name || 'Nueva Conversación',
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ chat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/projects/:projectId/chats/:chatId/messages
 */
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { data: messages, error } = await supabaseAdmin
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/projects/:projectId/chats/:chatId/messages
 */
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { projectId, chatId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // 1. Save user message
        const { error: userMsgError } = await supabaseAdmin
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                role: 'user',
                content
            });

        if (userMsgError) throw userMsgError;

        // 2. Get project settings and data for context
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('settings')
            .eq('id', projectId)
            .single();

        const settings = project?.settings || { ai_model: 'gemini-2.5-flash', language: 'es' };

        const { data: apiData } = await supabaseAdmin
            .from('api_data')
            .select('data, created_at, api_id, endpoint_id')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(5); // Last 5 technical captures

        // 3. Generate AI response
        let aiResponse = "";
        const context = JSON.stringify(apiData, null, 2);

        const systemPrompt = `Eres un asistente experto en análisis de datos comerciales para la plataforma DataLive.
TU OBJETIVO: Responder las dudas del usuario basándote en los DATOS TÉCNICOS capturados de las APIs.
IDIOMA: Responde SIEMPRE en ESPAÑOL.
TONO: Profesional, comercial y directo. Evita tecnicismos innecesarios.

DATOS DISPONIBLES (Contexto):
${context}

INSTRUCCIONES:
1. Si el usuario pregunta por datos específicos, búscalos en el contexto arriba.
2. Si no hay datos suficientes, indícalo amablemente y sugiere ejecutar una API.
3. No inventes datos.
4. Responde de forma que un ejecutivo de negocios lo entienda.`;

        if (settings.ai_model.includes('gemini')) {
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const result = await genAI.models.generateContent({
                model: settings.ai_model || "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPregunta: ${content}` }] }]
            });
            aiResponse = result.text;
        } else {
            const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
            const msg = await anthropic.messages.create({
                model: settings.ai_model || "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                messages: [{ role: "user", content: `${systemPrompt}\n\nPregunta: ${content}` }],
            });
            aiResponse = msg.content[0].text;
        }

        // 4. Save AI message
        const { data: assistantMsg, error: aiMsgError } = await supabaseAdmin
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                role: 'assistant',
                content: aiResponse
            })
            .select()
            .single();

        if (aiMsgError) throw aiMsgError;

        res.json({ message: assistantMsg });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
