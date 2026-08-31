import { NextResponse } from 'next/server';
import { adminToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// POST /api/admin/login  body: { password }
export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: 'Admin password is not configured (ADMIN_PASSWORD).' },
      { status: 500 }
    );
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', adminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 heures
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
