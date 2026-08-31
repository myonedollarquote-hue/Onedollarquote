import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStripe, PAGE_PRICE_CENTS, CURRENCY } from '@/lib/stripe';
import { RESERVATION_MINUTES } from '@/lib/limits';

export const runtime = 'nodejs';

// POST /api/checkout   body: { page_number: number }
// 1. Vérifie que la page n'est ni payée ni réservée par quelqu'un d'autre.
// 2. Pose une réservation de 10 min.
// 3. Crée une session Stripe Checkout et renvoie son URL.
export async function POST(req) {
  try {
    const { page_number } = await req.json();
    const pageNumber = parseInt(page_number, 10);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // La page existe-t-elle déjà ?
    const { data: existing, error: selErr } = await admin
      .from('pages')
      .select('*')
      .eq('page_number', pageNumber)
      .maybeSingle();

    if (selErr) throw selErr;

    if (existing?.is_paid) {
      return NextResponse.json({ error: 'This page is already taken.' }, { status: 409 });
    }

    // Réservée par quelqu'un d'autre et réservation encore valide ?
    if (existing?.reserved_until && existing.reserved_until > nowIso) {
      return NextResponse.json(
        { error: 'This page is being reserved. Try again in a few minutes.' },
        { status: 409 }
      );
    }

    const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString();

    // Crée ou met à jour la ligne avec la nouvelle réservation.
    const { error: upErr } = await admin
      .from('pages')
      .upsert(
        { page_number: pageNumber, reserved_until: reservedUntil, is_paid: false },
        { onConflict: 'page_number' }
      );
    if (upErr) throw upErr;

    // Crée la session de paiement Stripe.
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
            product_data: { name: `Page ${pageNumber} du livre` },
          },
        },
      ],
      metadata: { page_number: String(pageNumber) },
      success_url: `${siteUrl}/write?page=${pageNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?page=${pageNumber}`,
    });

    // On mémorise l'id de session pour vérification ultérieure.
    await admin
      .from('pages')
      .update({ stripe_session_id: session.id })
      .eq('page_number', pageNumber);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
