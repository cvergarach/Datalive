import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('api_data')
      .select('*, api_endpoints(method, path), discovered_apis(name)')
      .eq('project_id', projectId)
      .order('executed_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
