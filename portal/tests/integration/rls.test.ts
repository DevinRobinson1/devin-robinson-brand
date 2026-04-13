import { describe, it, expect, beforeEach } from 'vitest';
import { serviceClient, anonClient, resetDb, createAuthUser, signInAs } from '../helpers/db';

describe('RLS tenant isolation', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('prevents a user from reading another workspace', async () => {
    const svc = serviceClient();

    const aliceId = await createAuthUser('alice@a.com');
    const bobId   = await createAuthUser('bob@b.com');

    const { data: wsA, error: e1 } = await svc.from('workspaces').insert({
      name: 'Acme', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_a', stripe_subscription_id: 'sub_a',
    }).select().single();
    expect(e1).toBeNull();

    const { data: wsB, error: e2 } = await svc.from('workspaces').insert({
      name: 'Beta', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_b', stripe_subscription_id: 'sub_b',
    }).select().single();
    expect(e2).toBeNull();

    await svc.from('workspace_members').insert({
      workspace_id: wsA!.id, user_id: aliceId, role: 'owner', joined_at: new Date().toISOString(),
    });
    await svc.from('workspace_members').insert({
      workspace_id: wsB!.id, user_id: bobId,   role: 'owner', joined_at: new Date().toISOString(),
    });

    const aliceToken = await signInAs('alice@a.com');
    const aliceAnon = anonClient(aliceToken);

    const { data } = await aliceAnon.from('workspaces').select('*');
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(wsA!.id);
  });

  it('allows admin to read all workspaces', async () => {
    const svc = serviceClient();
    const adminId = await createAuthUser('admin@fchiefaio.com');
    await svc.from('profiles').update({ is_admin: true }).eq('user_id', adminId);

    await svc.from('workspaces').insert([
      { name: 'A', plan: 'entry', seat_limit: 1, stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' },
      { name: 'B', plan: 'growth', seat_limit: 3, stripe_customer_id: 'cus_2', stripe_subscription_id: 'sub_2' },
    ]);

    const token = await signInAs('admin@fchiefaio.com');
    const admin = anonClient(token);
    const { data } = await admin.from('workspaces').select('*');
    expect(data).toHaveLength(2);
  });
});
