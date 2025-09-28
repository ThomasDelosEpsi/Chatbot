import { createClient } from '@supabase/supabase-js';

// injectées par Webpack DefinePlugin
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnon = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  console.error('❌ SUPABASE_URL / SUPABASE_ANON_KEY manquants. Vérifie .env et webpack DefinePlugin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
