import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

// POST /api/admin/edit
// body: { page_number, content_type, content_text, author_signature, author_link }
export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const pn = parseInt(body.page_number, 10);
  const { content_type } = body;
  const text = (body.content_text || '').trim();
  const signature = (body.author_signature || '').trim();
  const link = (body.author_link || '').trim();

  if (!Number.isInteger(pn)) {
    return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  }
  if (content_type !== 'citation' && content_type !== 'histoire') {
    return NextResponse.json({ error: 'Invalid format.' }, { status: 400 });
  }
  const { min, max } = LIMITS[content_type];
  if (text.length < min || text.length > max) {
    return NextResponse.json(
      { error: `Text must be between ${min} and ${max} characters.` },
      { status: 400 }
    );
  }
  if (signature.length < 1 || signature.length > 60) {
    return NextResponse.json({ error: 'Signature must be 1 to 60 characters.' }, { status: 400 });
  }
  let finalLink = null;
  if (link) {
    if (!/^https?:\/\/.+/i.test(link) || link.length > 300) {
      return NextResponse.json({ error: 'A link must start with http:// or https://' }, { status: 400 });
    }
    finalLink = link;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('pages')
    .update({
      content_type,
      content_text: text,
      author_signature: signature,
      author_link: finalLink,
    })
    .eq('page_number', pn);

  if (error) {
    console.error('admin edit error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
