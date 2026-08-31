import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe } from '@/lib/stripe';
import { LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

// POST /api/write
// body: { page_number, session_id, content_type, content_text, author_signature }
export async function POST(req) {
  try {
    const body = await req.json();
    const pageNumber = parseInt(body.page_number, 10);
    const { session_id, content_type, content_text, author_signature, author_link } = body;

    // --- Validations de base ---
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
    }
    if (content_type !== 'citation' && content_type !== 'histoire') {
      return NextResponse.json({ error: 'Invalid format.' }, { status: 400 });
    }
    const text = (content_text || '').trim();
    const signature = (author_signature || '').trim();
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

    // Lien facultatif : vide OU une URL http(s) valide (max 300 caractères).
    const link = (author_link || '').trim();
    let finalLink = null;
    if (link) {
      if (!/^https?:\/\/.+/i.test(link) || link.length > 300) {
        return NextResponse.json({ error: 'A link must start with http:// or https://' }, { status: 400 });
      }
      finalLink = link;
    }

    // --- Vérification du paiement auprès de Stripe ---
    // Empêche d'écrire sans avoir payé, même en connaissant l'URL.
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (
      !session ||
      session.payment_status !== 'paid' ||
      parseInt(session.metadata?.page_number, 10) !== pageNumber
    ) {
      return NextResponse.json({ error: 'Payment could not be verified for this page.' }, { status: 402 });
    }

    const admin = getSupabaseAdmin();

    // Empêche la réécriture d'une page déjà rédigée.
    const { data: existing } = await admin
      .from('pages')
      .select('content_text')
      .eq('page_number', pageNumber)
      .maybeSingle();
    if (existing?.content_text) {
      return NextResponse.json({ error: 'This page has already been written.' }, { status: 409 });
    }

    // Enregistrement définitif (is_paid=true en secours si le webhook n'a pas encore tourné).
    const { error } = await admin
      .from('pages')
      .update({
        content_type,
        content_text: text,
        author_signature: signature,
        author_link: finalLink,
        is_paid: true,
        reserved_until: null,
      })
      .eq('page_number', pageNumber);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('write error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
