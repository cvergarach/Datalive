import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name
        }
      }
    });

    if (error) throw error;

    res.json({
      message: 'User created successfully',
      user: data.user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
