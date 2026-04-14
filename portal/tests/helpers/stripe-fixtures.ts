import Stripe from 'stripe';
import crypto from 'node:crypto';

export function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

export function checkoutSessionCompleted(overrides: Partial<{
  eventId: string; email: string; companyName: string; priceId: string;
  customerId: string; subscriptionId: string;
}> = {}): Stripe.Event {
  const email = overrides.email ?? 'alice@acme.com';
  return {
    id: overrides.eventId ?? `evt_${crypto.randomUUID()}`,
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: `cs_test_${crypto.randomUUID()}`,
        object: 'checkout.session',
        customer: overrides.customerId ?? `cus_${crypto.randomUUID()}`,
        subscription: overrides.subscriptionId ?? `sub_${crypto.randomUUID()}`,
        customer_email: email,
        customer_details: { email, name: 'Alice A' },
        custom_fields: [{ key: 'company_name', text: { value: overrides.companyName ?? 'Acme Inc.' } }],
        line_items: { data: [{ price: { id: overrides.priceId ?? process.env.STRIPE_PRICE_GROWTH } }] },
      } as any,
    },
  } as Stripe.Event;
}

export function subscriptionEvent(type: 'customer.subscription.updated' | 'customer.subscription.deleted', overrides: {
  subscriptionId: string; priceId?: string;
}): Stripe.Event {
  return {
    id: `evt_${crypto.randomUUID()}`,
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: overrides.subscriptionId,
        object: 'subscription',
        items: { data: [{ price: { id: overrides.priceId ?? process.env.STRIPE_PRICE_GROWTH } }] },
      } as any,
    },
  } as Stripe.Event;
}
