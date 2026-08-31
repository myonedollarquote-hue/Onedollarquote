import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// POST /api/admin/delete  body: { page_number }
// Supprime la ligne → la page redevient vierge et rachetable.
export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { page_number } = await req.json();
  const pn = parseInt(page_number, 10);
  if (!Number.isInteger(pn)) {
    return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('pages').delete().eq('page_number', pn);
  if (error) {
    console.error('admin delete error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
