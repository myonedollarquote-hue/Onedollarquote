import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

// POST /api/admin/create
// L'admin publie une page GRATUITEMENT (sans paiement Stripe).
// body: { page_number (optionnel), content_type, content_text, author_signature, author_link }
export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { content_type } = body;
    const text = (body.content_text || '').trim();
    const signature = (body.author_signature || '').trim();
    const link = (body.author_link || '').trim();

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

    // Numéro de page : fourni, ou "prochaine libre".
    const hasPage = body.page_number !== '' && body.page_number != null;
    let requested = 1;
    if (hasPage) {
      requested = parseInt(body.page_number, 10);
      if (!Number.isInteger(requested) || requested < 1) {
        return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
      }
      // Ne pas écraser une page déjà rédigée.
      const { data: existing } = await admin
        .from('pages')
        .select('content_text')
        .eq('page_number', requested)
        .maybeSingle();
      if (existing?.content_text) {
        return NextResponse.json(
          { error: 'This page is already written. Delete it first to reuse it.' },
          { status: 409 }
        );
      }
    }

    // Réutilise la fonction d'attribution atomique (page demandée si libre, sinon la suivante).
    // Session synthétique unique pour marquer une création admin gratuite.
    const sid = 'admin-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const { data, error } = await admin.rpc('claim_and_write', {
      p_requested: requested,
      p_session: sid,
      p_type: content_type,
      p_text: text,
      p_signature: signature,
      p_link: finalLink,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, page_number: data });
  } catch (err) {
    console.error('admin create error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
