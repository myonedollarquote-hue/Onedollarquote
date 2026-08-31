import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
// Important : on a besoin du corps BRUT pour vérifier la signature Stripe.
export const dynamic = 'force-dynamic';

// POST /api/webhook  (appelé par Stripe, pas par le navigateur)
export async function POST(req) {
  const stripe = getStripe();
  const signature = req.headers.get('stripe-signature');
  const body = await req.text(); // corps brut

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide :', err.message);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const pageNumber = parseInt(session.metadata?.page_number, 10);

    if (Number.isInteger(pageNumber)) {
      const admin = getSupabaseAdmin();
      // Le paiement est confirmé → la page est payée.
      // Le contenu sera rempli ensuite par l'acheteur (écran /write).
      const { error } = await admin
        .from('pages')
        .update({ is_paid: true, reserved_until: null })
        .eq('page_number', pageNumber);
      if (error) console.error('MAJ is_paid échouée :', error);
    }
  }

  return NextResponse.json({ received: true });
}
