import Stripe from 'stripe';

// Initialisation paresseuse pour éviter d'exiger la clé au build.
let _stripe = null;

export function getStripe() {
  if (_stripe) return _stripe;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  return _stripe;
}

// Prix d'une page, en centimes. 100 = 1,00 €.
export const PAGE_PRICE_CENTS = 100;
export const CURRENCY = 'eur';
