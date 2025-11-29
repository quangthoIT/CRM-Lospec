import { createClient } from '@supabase/supabase-js';

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseANONKEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseURL || !supabaseANONKEY) {
  throw new Error('Supabase URL hoặc Anon Key chưa được cấu hình trong file .env');
}

export const supabase = createClient(supabaseURL, supabaseANONKEY);