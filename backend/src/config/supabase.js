import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Client for user operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for service operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

export default supabase;
