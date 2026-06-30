/* ============================================
   SUPABASE CLIENT SETUP
   ============================================ */
import { CONFIG } from './config.js';

// Initialize the Supabase client using the global window.supabase object (loaded via CDN)
export const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);
