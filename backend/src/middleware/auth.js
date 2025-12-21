import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const checkProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const { data: membership, error } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !membership) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    req.projectRole = membership.role;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Project access check failed' });
  }
};
