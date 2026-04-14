import type Stripe from 'stripe';

export type ParsedCheckout = {
  email: string;
  fullName: string | null;
  companyName: string;
  priceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export function parseCheckoutSession(
  session: Stripe.Checkout.Session & { line_items?: Stripe.ApiList<Stripe.LineItem> }
): ParsedCheckout {
  const email = session.customer_email ?? session.customer_details?.email;
  if (!email) throw new Error('checkout.session missing customer_email');

  const priceId = session.line_items?.data?.[0]?.price?.id;
  if (!priceId) throw new Error('checkout.session missing line_items[0].price.id');

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!customerId) throw new Error('checkout.session missing customer');

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) throw new Error('checkout.session missing subscription');

  const companyField = session.custom_fields?.find((f) => f.key === 'company_name');
  const companyName = companyField?.text?.value?.trim() || `${email}'s workspace`;

  return {
    email,
    fullName: session.customer_details?.name ?? null,
    companyName,
    priceId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  };
}
