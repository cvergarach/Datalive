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

        console.log(`💬 Chat request: Project=${projectId}, Chat=${chatId}, User=${userId}`);

        if (!projectId) {
            throw new Error('Project ID is required for chat context');
        }

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
            .select('data, executed_at, api_endpoints(path, description), discovered_apis(name)')
            .eq('project_id', projectId)
            .order('executed_at', { ascending: false })

            .limit(10); // Last 10 technical captures


        console.log(`🔍 Chat context for project ${projectId}: found ${apiData?.length || 0} records`);
        if (apiData && apiData.length > 0) {
            console.log(`💡 First record keys: ${Object.keys(apiData[0])}`);
        }

        // 3. Generate AI response
        let aiResponse = "";
        let context = JSON.stringify(apiData, null, 2);

        console.log(`📊 Raw context length: ${context.length} characters`);

        // Truncate if too long (very large JSON can confuse or crash LLM requests)
        if (context.length > 50000) {
            console.warn('⚠️ Context too long, truncating to 50k characters');
            context = context.substring(0, 50000) + '... [TRUNCATED]';
        }

        console.log(`🔍 Context Preview: ${context.substring(0, 200)}...`);




        const systemPrompt = `Eres un asistente experto en análisis de datos comerciales para la plataforma DataLive.
TU OBJETIVO: Responder las dudas del usuario basándote en los DATOS TÉCNICOS capturados de las APIs del cliente.

CONTEXTO DE DATOS (JSON):
A continuación se muestran los últimos datos capturados de las APIs. Cada registro contiene el nombre de la API, la ruta del endpoint y la 'data' resultante.
----------------------
${context}
----------------------

INSTRUCCIONES CRÍTICAS:
1. **Analiza el campo 'data'**: Ahí reside la información real (ej: listas de empresas, montos, estados).
2. **Traducción Comercial**: Si encuentras datos técnicos, tradúcelos a lenguaje de negocio. Ej: "Hay 899 registros de compradores en Mercado Público".
3. **Persistencia**: Si el usuario pregunta "qué hay", resume brevemente qué APIs han devuelto datos y qué información general contienen.
4. **Honestidad**: Si el contexto está vacío ([]) o no contiene lo solicitado, indica que no hay capturas recientes para esa consulta y sugiere ejecutar la API correspondiente desde la sección de 'APIs'.
5. **Idioma**: Responde SIEMPRE en ESPAÑOL.
6. **No inventes**: Solo usa la información presente en el contexto superior.`;


        if (settings.ai_model?.includes('gemini')) {
            console.log(`💬 Chat using Gemini: ${settings.ai_model || 'gemini-2.5-flash'}`);
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const result = await genAI.models.generateContent({
                model: settings.ai_model || "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nPregunta: ${content}` }] }]
            });
            aiResponse = result.text;
        } else {
            console.log(`💬 Chat using Claude: ${settings.ai_model || 'claude-3-5-sonnet-20241022'}`);
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
