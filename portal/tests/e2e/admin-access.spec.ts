import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';

test.beforeEach(async () => { await resetDb(); });

test('non-admin redirected away from /admin', async ({ page }) => {
  const svc = serviceClient();
  const { data } = await svc.auth.admin.createUser({
    email: 'client@acme.com', password: 'correct-horse-battery-staple', email_confirm: true,
  });
  await svc.from('profiles').insert({ user_id: data.user!.id, full_name: 'Client', is_admin: false });
  const { data: ws } = await svc.from('workspaces').insert({
    name: 'Client Co', plan: 'entry', seat_limit: 1,
    stripe_customer_id: 'cus_c', stripe_subscription_id: 'sub_c',
  }).select().single();
  await svc.from('workspace_members').insert({
    workspace_id: ws!.id, user_id: data.user!.id, role: 'owner', joined_at: new Date().toISOString(),
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByPlaceholder('you@company.com').fill('client@acme.com');
  await page.getByPlaceholder(/Password/).fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);

  await page.goto('/admin');
  await page.waitForURL(/\/dashboard/);
});
