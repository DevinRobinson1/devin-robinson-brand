import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { subscriptionEvent, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({ sendMagicLinkEmail: vi.fn(), sendInviteEmail: vi.fn() }));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook: customer.subscription.updated', () => {
  beforeEach(async () => { await resetDb(); });

  it('updates plan and seat_limit on price change', async () => {
    const svc = serviceClient();
    await svc.from('workspaces').insert({
      name: 'Acme', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_x', stripe_subscription_id: 'sub_x',
    });

    const event = subscriptionEvent('customer.subscription.updated', {
      subscriptionId: 'sub_x', priceId: process.env.STRIPE_PRICE_SCALE!,
    });
    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);

    const { data } = await svc.from('workspaces').select('*').eq('stripe_subscription_id', 'sub_x').single();
    expect(data!.plan).toBe('scale');
    expect(data!.seat_limit).toBe(5);
  });
});
