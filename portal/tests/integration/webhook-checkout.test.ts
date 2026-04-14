import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(event: any): Request {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  });
}

describe('webhook: checkout.session.completed', () => {
  beforeEach(async () => { await resetDb(); });

  it('provisions a workspace, owner membership, and sends magic link', async () => {
    const event = checkoutSessionCompleted({
      email: 'alice@acme.com',
      companyName: 'Acme Inc.',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
    });
    const res = await POST(makeRequest(event) as any);
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data: workspaces } = await svc.from('workspaces').select('*');
    expect(workspaces).toHaveLength(1);
    expect(workspaces![0].plan).toBe('growth');
    expect(workspaces![0].seat_limit).toBe(3);
    expect(workspaces![0].name).toBe('Acme Inc.');

    const { data: members } = await svc.from('workspace_members').select('*');
    expect(members).toHaveLength(1);
    expect(members![0].role).toBe('owner');

    const { data: audit } = await svc.from('audit_log').select('*');
    expect(audit!.some((a) => a.action === 'workspace.provisioned')).toBe(true);
  });

  it('rejects invalid signature', async () => {
    const event = checkoutSessionCompleted();
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      body: JSON.stringify(event),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('alerts on unknown price_id', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('ok'));
    const event = checkoutSessionCompleted({ priceId: 'price_unknown_xyz' });
    const res = await POST(makeRequest(event) as any);
    expect(res.status).toBe(500);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/alert'),
      expect.objectContaining({ method: 'POST' })
    );
    fetchSpy.mockRestore();
  });
});
