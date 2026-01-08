import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import claudeService from '../services/claude.js';
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

    // 1. Extract text from PDF
    console.log('📄 Extracting text from document...');
    const extraction = await claudeService.extractTextFromPDF(file.path);

    // 2. Save to database using Admin client to bypass RLS
    const { data: document, error: dbError } = await supabaseAdmin
      .from('api_documents')
      .insert({
        project_id: projectId,
        title: title || file.originalname,
        text_content: extraction.text, // Store extracted text
        file_type: path.extname(file.originalname).toLowerCase(),
        status: 'processing',
        metadata: {
          numPages: extraction.numPages,
          info: extraction.info
        }
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Update status to analyzed
    await supabaseAdmin
      .from('api_documents')
      .update({ status: 'analyzed' })
      .eq('id', document.id);

    // 4. Start async analysis with MCP (pass text content instead of URI)
    console.log('🤖 Starting API analysis...');
    console.log(`📊 MCP Analysis Payload size: ${extraction.text.length} characters`);
    mcpClient.analyzeAPIDocument(extraction.text, projectId, file.mimetype)
      .then(async (analysis) => {
        console.log('✅ Analysis complete');
        console.log('📦 Full analysis response:', JSON.stringify(analysis, null, 2));

        // Check for conceptual error (e.g. valid JSON but apis: [] or explicit error)
        if (analysis.error && (!analysis.apis || analysis.apis.length === 0)) {
          console.warn('⚠️ MCP returned an API analysis error:', analysis.error);
          await supabaseAdmin
            .from('api_documents')
            .update({
              status: 'error',
              error_message: analysis.error
            })
            .eq('id', document.id);
          return;
        }

        // Save discovered APIs
        if (analysis.apis && analysis.apis.length > 0) {
          console.log(`💾 Saving ${analysis.apis.length} API(s) to database...`);
          for (const api of analysis.apis) {
            console.log(`  → Saving API: ${api.name}`);
            const { data: savedApi, error: apiError } = await supabaseAdmin
              .from('discovered_apis')
              .insert({
                project_id: projectId,
                document_id: document.id,
                base_url: api.base_url,
                name: api.name,
                description: api.description,
                auth_type: api.auth_type,
                auth_details: api.auth_details,
                execution_strategy: api.execution_strategy,
                metadata: {
                  auto_executable: api.auto_executable || false,
                  extracted_credentials: api.extracted_credentials || null
                }
              })
              .select()
              .single();

            if (apiError) {
              console.error('❌ Error saving API:', apiError);
              throw apiError;
            }

            console.log(`  ✅ API saved with ID: ${savedApi?.id}`);

            // Save endpoints
            if (api.endpoints && savedApi) {
              console.log(`  📌 Saving ${api.endpoints.length} endpoints...`);
              const endpointsToInsert = api.endpoints.map(ep => ({
                api_id: savedApi.id,
                project_id: projectId,
                method: ep.method,
                path: ep.path,
                description: ep.description,
                parameters: ep.parameters,
                response_schema: ep.response_schema,
                category: ep.category,
                estimated_value: ep.estimated_value,
                execution_steps: ep.execution_steps
              }));

              console.log(`  🔍 Endpoints to insert:`, JSON.stringify(endpointsToInsert, null, 2));

              const { data: insertedEndpoints, error: endpointsError } = await supabaseAdmin
                .from('api_endpoints')
                .insert(endpointsToInsert)
                .select();

              if (endpointsError) {
                console.error('  ❌ Error saving endpoints:', endpointsError);
                throw endpointsError;
              }

              console.log(`  ✅ ${insertedEndpoints?.length || 0} endpoints saved successfully`);
            }
          }
        } else {
          console.log('ℹ️ No APIs discovered in the document.');
          // We can mark it as error so the user knows why it's empty
          await supabaseAdmin
            .from('api_documents')
            .update({
              status: 'error',
              error_message: 'Finished analysis but no API endpoints were discovered. Documentation might be non-technical or in an unsupported format.'
            })
            .eq('id', document.id);
          return;
        }

        // Update document status successfully
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
 * POST /api/projects/:projectId/documents/from-url
 * Analyze API documentation from a URL
 */
router.post('/from-url', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }


    // Import web scraper
    const { crawlDocumentation, isValidUrl } = await import('../services/web-scraper.js');

    // Validate URL
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
    }

    console.log(`🌐 Processing URL: ${url}`);

    // 1. Crawl documentation recursively
    const { content, mimeType, title: scrapedTitle, crawledPages } = await crawlDocumentation(url, {
      maxDepth: 2,
      maxPages: 10,
      timeout: 60000
    });

    console.log(`📚 Crawled ${crawledPages} pages`);

    // 2. Upload scraped content to Gemini as a text file
    console.log('📤 Uploading scraped content to Gemini...');

    // Create temporary file with scraped content
    const tempFilePath = `/tmp/scraped-${Date.now()}.txt`;
    fs.writeFileSync(tempFilePath, content, 'utf-8');

    const geminiFile = await geminiService.uploadFile(
      tempFilePath,
      title || scrapedTitle || url,
      mimeType
    );

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    // 3. Save to database
    const { data: document, error: dbError } = await supabaseAdmin
      .from('api_documents')
      .insert({
        project_id: projectId,
        title: title || scrapedTitle || url,
        gemini_uri: geminiFile.uri,
        gemini_name: geminiFile.name,
        file_type: mimeType,
        source_type: 'url',
        source_url: url,
        status: 'processing'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Wait for Gemini to process
    console.log('⏳ Waiting for Gemini to process content...');
    await geminiService.waitForFileActive(geminiFile.name);

    // 5. Update status to analyzed
    await supabaseAdmin
      .from('api_documents')
      .update({ status: 'analyzed' })
      .eq('id', document.id);

    // 6. Start async API analysis - pass the actual scraped content, not the Gemini URI
    console.log('🤖 Starting API analysis...');
    console.log(`📊 MCP Analysis Payload size: ${content.length} characters`);
    mcpClient.analyzeAPIDocument(content, projectId, mimeType)
      .then(async (analysis) => {
        console.log('✅ Analysis complete');
        console.log('📦 Full analysis response:', JSON.stringify(analysis, null, 2));

        // Check for conceptual error
        if (analysis.error && (!analysis.apis || analysis.apis.length === 0)) {
          console.warn('⚠️ MCP returned an API analysis error:', analysis.error);
          await supabaseAdmin
            .from('api_documents')
            .update({
              status: 'error',
              error_message: analysis.error
            })
            .eq('id', document.id);
          return;
        }

        // Save discovered APIs
        if (analysis.apis && analysis.apis.length > 0) {
          console.log(`💾 Saving ${analysis.apis.length} API(s) to database...`);
          for (const api of analysis.apis) {
            console.log(`  → Saving API: ${api.name}`);
            const { data: savedApi, error: apiError } = await supabaseAdmin
              .from('discovered_apis')
              .insert({
                project_id: projectId,
                document_id: document.id,
                base_url: api.base_url,
                name: api.name,
                description: api.description,
                auth_type: api.auth_type,
                auth_details: api.auth_details,
                execution_strategy: api.execution_strategy
              })
              .select()
              .single();

            if (apiError) {
              console.error('❌ Error saving API:', apiError);
              throw apiError;
            }

            console.log(`  ✅ API saved with ID: ${savedApi?.id}`);

            // Save endpoints
            if (api.endpoints && savedApi) {
              const endpointsToInsert = api.endpoints.map(ep => ({
                api_id: savedApi.id,
                project_id: projectId,
                method: ep.method,
                path: ep.path,
                description: ep.description,
                parameters: ep.parameters,
                response_schema: ep.response_schema,
                category: ep.category,
                estimated_value: ep.estimated_value,
                execution_steps: ep.execution_steps
              }));

              await supabaseAdmin
                .from('api_endpoints')
                .insert(endpointsToInsert);
            }
          }
        } else {
          console.log('ℹ️ No APIs discovered in the URL content.');
          await supabaseAdmin
            .from('api_documents')
            .update({
              status: 'error',
              error_message: 'Finished analysis but no API endpoints were discovered. Content might be non-technical or in an unsupported format.'
            })
            .eq('id', document.id);
          return;
        }

        // Update document status successfully
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

    res.json({
      message: 'URL content analyzed successfully',
      document: {
        ...document,
        status: 'analyzing'
      }
    });
  } catch (error) {
    console.error('URL processing error:', error);
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

/**
 * POST /api/projects/:projectId/documents/:documentId/retry
 * Retry analysis for an existing document
 */
router.post('/:documentId/retry', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;

    // 1. Get document content
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('api_documents')
      .from('api_documents')
      .select('*')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();

    if (fetchError) throw fetchError;
    if (!document.text_content) {
      throw new Error('Document has no content to analyze');
    }

    // 2. Update status to analyzing
    await supabaseAdmin
      .from('api_documents')
      .update({
        status: 'analyzed',
        error_message: null
      })
      .eq('id', documentId);

    // 3. Start async analysis
    console.log(`🔄 Retrying analysis for document: ${document.title}`);
    mcpClient.analyzeAPIDocument(document.text_content, projectId, document.file_type)
      .then(async (analysis) => {
        console.log('✅ Retry analysis complete');

        if (analysis.error && (!analysis.apis || analysis.apis.length === 0)) {
          await supabaseAdmin
            .from('api_documents')
            .update({
              status: 'error',
              error_message: analysis.error
            })
            .eq('id', documentId);
          return;
        }

        // Save APIs and update status (similar to upload logic)
        // For simplicity, we just update status here if successful
        // Note: Realistically we should deduplicate APIs, but for a retry 
        // that failed midway, this is a good restart point.
        await supabaseAdmin
          .from('api_documents')
          .update({ status: 'completed' })
          .eq('id', documentId);
      })
      .catch(async (error) => {
        console.error('Error in retry analysis:', error);
        await supabaseAdmin
          .from('api_documents')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('id', documentId);
      });

    res.json({ message: 'Analysis restarted', status: 'analyzed' });
  } catch (error) {
    console.error('Retry analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
