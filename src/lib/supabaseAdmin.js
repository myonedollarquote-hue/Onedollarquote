import { createClient } from '@supabase/supabase-js';

// Client "admin" — À N'UTILISER QUE CÔTÉ SERVEUR (route handlers).
// Il utilise la clé service_role qui contourne la RLS.
// On l'initialise paresseusement pour ne pas exiger les variables
// d'environnement au moment du build.
let _admin = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;
  _admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  return _admin;
}
