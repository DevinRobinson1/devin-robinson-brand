import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/invites/route';
import { resetDb, serviceClient, createAuthUser, signInAs } from '../helpers/db';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/invites', () => {
  beforeEach(async () => { await resetDb(); });

  async function seedOwner(plan: 'growth' | 'entry' = 'growth') {
    const svc = serviceClient();
    const ownerId = await createAuthUser('owner@acme.com');
    const { data: ws } = await svc.from('workspaces').insert({
      name: 'Acme', plan, seat_limit: plan === 'growth' ? 3 : 1,
      stripe_customer_id: `cus_${Date.now()}`, stripe_subscription_id: `sub_${Date.now()}`,
    }).select().single();
    await svc.from('workspace_members').insert({
      workspace_id: ws!.id, user_id: ownerId, role: 'owner', joined_at: new Date().toISOString(),
    });
    const token = await signInAs('owner@acme.com');
    return { ownerId, workspaceId: ws!.id, token };
  }

  function makeReq(token: string, body: any) {
    return new Request('http://localhost/api/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, cookie: '' },
      body: JSON.stringify(body),
    }) as any;
  }

  it('rejects when seat limit reached', async () => {
    const { workspaceId, token } = await seedOwner('entry');
    const res = await POST(makeReq(token, { workspaceId, email: 'second@acme.com' }));
    expect(res.status).toBe(403);
  });

  it('creates pending invite under the limit', async () => {
    const { workspaceId, token } = await seedOwner('growth');
    const res = await POST(makeReq(token, { workspaceId, email: 'second@acme.com' }));
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data } = await svc.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    expect(data).toHaveLength(2);
    const pending = data!.find((m) => m.invited_email === 'second@acme.com');
    expect(pending).toBeTruthy();
    expect(pending!.user_id).toBeNull();
  });

  it('rejects non-owner', async () => {
    const svc = serviceClient();
    const { workspaceId } = await seedOwner('growth');
    const nonOwnerId = await createAuthUser('notowner@other.com');
    await svc.from('workspace_members').insert({
      workspace_id: workspaceId, user_id: nonOwnerId, role: 'member', joined_at: new Date().toISOString(),
    });
    const token = await signInAs('notowner@other.com');
    const res = await POST(makeReq(token, { workspaceId, email: 'third@acme.com' }));
    expect(res.status).toBe(403);
  });
});
