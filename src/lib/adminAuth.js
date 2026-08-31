import crypto from 'crypto';

// Jeton de session dérivé du mot de passe admin.
// Stateless : on peut le vérifier sans stocker de session en base.
// Si ADMIN_PASSWORD change, tous les anciens cookies deviennent invalides.
const SALT = 'livre-admin-v1';

export function adminToken() {
  const pw = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(SALT + pw).digest('hex');
}

// Vérifie le cookie de session sur une requête (NextRequest).
export function isAuthed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false; // aucun mot de passe configuré → accès bloqué
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && cookie === adminToken();
}
