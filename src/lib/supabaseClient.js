import { createClient } from '@supabase/supabase-js';

// Client "public" utilisé côté navigateur.
// Il utilise la clé anon : il ne peut lire que ce que la RLS autorise
// (ici : les pages publiées). Aucune donnée secrète ici.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
