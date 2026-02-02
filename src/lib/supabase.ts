import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      'Missing Supabase environment variables:',
      `VITE_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'MISSING'}`,
      `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'OK' : 'MISSING'}`,
    ].join('\n')
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
