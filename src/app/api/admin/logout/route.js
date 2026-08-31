import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// POST /api/admin/logout
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
