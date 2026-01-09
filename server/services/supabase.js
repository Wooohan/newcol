import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Missing Supabase configuration in environment variables');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

// Service role client (full access, server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Anon client (for client-side operations)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    logger.info('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Initialize connection test
testConnection();

export default supabaseAdmin;
