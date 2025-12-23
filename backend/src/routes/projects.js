import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Use admin client to ensure we get all projects owned by user, bypassing RLS or missing member records
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add owner role manually since we know they are the owner
    const projectsWithRole = projects.map(p => ({
      ...p,
      user_role: 'owner'
    }));

    res.json({ projects: projectsWithRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Create project using Admin client to bypass RLS insertion check
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        description,
        owner_id: userId
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add creator as owner
    const { error: memberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) throw memberError;

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check user has access
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ project, user_role: membership.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check user is owner or admin
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('role')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update project
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id/dependencies
 * Check project dependencies before deletion
 */
router.get('/:id/dependencies', async (req, res) => {
  try {
    const { id } = req.params;

    const counts = {
      documents: 0,
      apis: 0,
      endpoints: 0,
      data: 0,
      insights: 0,
      dashboards: 0
    };

    // Parallel count queries
    const [
      { count: docsCount },
      { count: apisCount },
      { count: dataCount },
      { count: insightsCount },
      { count: dashboardsCount }
    ] = await Promise.all([
      supabaseAdmin.from('api_documents').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('discovered_apis').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('api_data').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('insights').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('dashboards').select('*', { count: 'exact', head: true }).eq('project_id', id)
    ]);

    counts.documents = docsCount || 0;
    counts.apis = apisCount || 0;
    counts.data = dataCount || 0;
    counts.insights = insightsCount || 0;
    counts.dashboards = dashboardsCount || 0;

    res.json({ counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check user is owner
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (projectError || !project || project.owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can delete project' });
    }

    // Delete project (cascades to members, documents, etc.)
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
