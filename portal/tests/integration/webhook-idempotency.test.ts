import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook idempotency', () => {
  beforeEach(async () => { await resetDb(); });

  it('is a no-op on duplicate event_id', async () => {
    const event = checkoutSessionCompleted({
      eventId: 'evt_dup_test',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
    });

    const first = await POST(makeRequest(event));
    expect(first.status).toBe(200);

    const second = await POST(makeRequest(event));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true });

    const svc = serviceClient();
    const { data } = await svc.from('workspaces').select('*');
    expect(data).toHaveLength(1);
  });
});
