import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, checkProjectAccess } from '../middleware/auth.js';
const router = express.Router({ mergeParams: true });
router.use(authMiddleware);
router.use(checkProjectAccess);
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabaseAdmin.from('project_integrations').select('*').eq('project_id', projectId);
    if (error) throw error;
    res.json({ integrations: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
