import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// GET /api/admin/pages → toutes les pages (contourne la RLS via service_role)
export async function GET(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('pages')
    .select('*')
    .order('page_number', { ascending: true });

  if (error) {
    console.error('admin pages error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
  return NextResponse.json({ pages: data });
}
