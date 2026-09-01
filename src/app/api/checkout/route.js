import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe, PAGE_PRICE_CENTS, CURRENCY } from '@/lib/stripe';

export const runtime = 'nodejs';

// POST /api/checkout   body: { page_number }
// Ne réserve PLUS rien : revenir en arrière n'a aucun effet.
// La page est réellement attribuée au moment de l'écriture (après paiement).
export async function POST(req) {
  try {
    const { page_number } = await req.json();
    const pageNumber = parseInt(page_number, 10);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
    }

    // Petit confort : si la page est déjà écrite, on évite de faire payer pour rien.
    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from('pages')
      .select('content_text')
      .eq('page_number', pageNumber)
      .maybeSingle();
    if (existing?.content_text) {
      return NextResponse.json({ error: 'This page is already taken.' }, { status: 409 });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: PAGE_PRICE_CENTS,
            product_data: { name: 'A page in the book' },
          },
        },
      ],
      metadata: { page_number: String(pageNumber) },
      success_url: `${siteUrl}/write?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?page=${pageNumber}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
