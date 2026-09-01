import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Le paiement est désormais vérifié directement lors de l'écriture (/api/write),
// et la page est attribuée à ce moment-là. Le webhook n'a donc plus de rôle
// critique : on accuse simplement réception pour que Stripe soit content.
export async function POST() {
  return NextResponse.json({ received: true });
}
