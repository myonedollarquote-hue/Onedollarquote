import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

// POST /api/admin/refund  body: { page_number }
// Rembourse le paiement lié à la page via Stripe.
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
  const { data: page } = await admin
    .from('pages')
    .select('stripe_session_id')
    .eq('page_number', pn)
    .maybeSingle();

  if (!page?.stripe_session_id) {
    return NextResponse.json({ error: 'No payment found for this page.' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(page.stripe_session_id);
    const pi = session.payment_intent;
    if (!pi) {
      return NextResponse.json({ error: 'No payment intent found.' }, { status: 400 });
    }
    await stripe.refunds.create({ payment_intent: typeof pi === 'string' ? pi : pi.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin refund error:', err);
    return NextResponse.json({ error: err.message || 'Refund failed.' }, { status: 500 });
  }
}
