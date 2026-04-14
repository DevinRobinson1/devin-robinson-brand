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

describe('webhook: email collision', () => {
  beforeEach(async () => { await resetDb(); });

  it('attaches second workspace to existing user', async () => {
    const evt1 = checkoutSessionCompleted({
      eventId: 'evt_1',
      email: 'twice@acme.com',
      priceId: process.env.STRIPE_PRICE_ENTRY!,
      customerId: 'cus_1', subscriptionId: 'sub_1',
      companyName: 'First Co',
    });
    await POST(makeRequest(evt1));

    const evt2 = checkoutSessionCompleted({
      eventId: 'evt_2',
      email: 'twice@acme.com',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
      customerId: 'cus_2', subscriptionId: 'sub_2',
      companyName: 'Second Co',
    });
    const res = await POST(makeRequest(evt2));
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data: workspaces } = await svc.from('workspaces').select('*').order('created_at');
    expect(workspaces).toHaveLength(2);

    const { data: users } = await svc.auth.admin.listUsers();
    const count = users!.users.filter((u) => u.email === 'twice@acme.com').length;
    expect(count).toBe(1);

    const { data: members } = await svc.from('workspace_members').select('*');
    expect(members).toHaveLength(2);
    const userIds = new Set(members!.map((m) => m.user_id));
    expect(userIds.size).toBe(1);
  });
});
