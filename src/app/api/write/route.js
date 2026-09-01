import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe } from '@/lib/stripe';
import { LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

// POST /api/write
// body: { session_id, content_type, content_text, author_signature, author_link }
// La page demandée est lue depuis la session Stripe (metadata), pas depuis le client.
export async function POST(req) {
  try {
    const body = await req.json();
    const { session_id, content_type } = body;
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

    // Vérifie le paiement auprès de Stripe (empêche d'écrire sans avoir payé).
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 402 });
    }
    const requested = parseInt(session.metadata?.page_number, 10) || 1;

    // Attribue une page (celle demandée si libre, sinon la suivante libre) + écrit.
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc('claim_and_write', {
      p_requested: requested,
      p_session: session_id,
      p_type: content_type,
      p_text: text,
      p_signature: signature,
      p_link: finalLink,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, page_number: data });
  } catch (err) {
    console.error('write error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
