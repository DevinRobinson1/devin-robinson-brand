import Stripe from 'stripe';

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
  }
  return client;
}
