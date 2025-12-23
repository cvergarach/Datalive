import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import geminiService from '../services/gemini.js';
import mcpClient from '../services/mcp-client.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md', '.html', '.docx', '.doc', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, TXT, MD, HTML, DOCX, DOC, JSON'));
    }
  }
});

/**
 * POST /api/projects/:projectId/documents/upload
 * Upload an API documentation file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { projectId } = req.params;
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    uploadedFilePath = file.path;

    // 1. Upload to Gemini File API
    console.log('📤 Uploading file to Gemini...');
    const geminiFile = await geminiService.uploadFile(
      file.path,
      title || file.originalname,
      file.mimetype
    );

    // 2. Save to database using Admin client to bypass RLS
    const { data: document, error: dbError } = await supabaseAdmin
      .from('api_documents')
      .insert({
        project_id: projectId,
        title: title || file.originalname,
        gemini_uri: geminiFile.uri,
        gemini_name: geminiFile.name,
        file_type: path.extname(file.originalname).toLowerCase(),
        status: 'processing'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Wait for Gemini to process
    console.log('⏳ Waiting for Gemini to process file...');
    await geminiService.waitForFileActive(geminiFile.name);

    // 4. Update status to analyzed
    await supabaseAdmin
      .from('api_documents')
      .update({ status: 'analyzed' })
      .eq('id', document.id);

    // 5. Start async analysis with MCP
    console.log('🤖 Starting API analysis...');
    mcpClient.analyzeAPIDocument(geminiFile.uri, projectId, geminiFile.mimeType)
      .then(async (analysis) => {
        console.log('✅ Analysis complete');

        // Save discovered APIs
        if (analysis.apis && analysis.apis.length > 0) {
          for (const api of analysis.apis) {
            const { data: savedApi } = await supabaseAdmin
              .from('discovered_apis')
              .insert({
                project_id: projectId,
                document_id: document.id,
                base_url: api.base_url,
                name: api.name,
                description: api.description,
                auth_type: api.auth_type,
                auth_details: api.auth_details
              })
              .select()
              .single();

            // Save endpoints
            if (api.endpoints && savedApi) {
              const endpointsToInsert = api.endpoints.map(ep => ({
                api_id: savedApi.id,
                method: ep.method,
                path: ep.path,
                description: ep.description,
                parameters: ep.parameters,
                response_schema: ep.response_schema,
                category: ep.category,
                estimated_value: ep.estimated_value
              }));

              await supabaseAdmin
                .from('api_endpoints')
                .insert(endpointsToInsert);
            }
          }
        }

        // Update document status
        await supabaseAdmin
          .from('api_documents')
          .update({ status: 'completed' })
          .eq('id', document.id);
      })
      .catch(async (error) => {
        console.error('Error in API analysis:', error);
        await supabaseAdmin
          .from('api_documents')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('id', document.id);
      });

    // Clean up uploaded file
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    res.json({
      message: 'Document uploaded successfully',
      document: {
        ...document,
        status: 'analyzing' // Return analyzing since async process started
      }
    });
  } catch (error) {
    // Clean up on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/documents
 * Get all documents in a project
 */
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: documents, error } = await supabaseAdmin
      .from('api_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/documents/:documentId
 * Get a specific document
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;

    const { data: document, error } = await supabaseAdmin
      .from('api_documents')
      .select('*')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();

    if (error) throw error;

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/documents/:documentId/dependencies
 * Check document dependencies before deletion
 */
router.get('/:documentId/dependencies', async (req, res) => {
  try {
    const { documentId } = req.params;

    const { count: apisCount, error } = await supabaseAdmin
      .from('discovered_apis')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId);

    if (error) throw error;

    res.json({
      counts: {
        apis: apisCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/:projectId/documents/:documentId
 * Delete a document
 */
router.delete('/:documentId', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;

    // Get document info
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('api_documents')
      .select('gemini_name')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from Gemini
    try {
      await geminiService.deleteFile(document.gemini_name);
    } catch (geminiError) {
      console.error('Error deleting from Gemini:', geminiError);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('api_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
