import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';

test.beforeEach(async () => { await resetDb(); });

test('password login after set', async ({ page }) => {
  const svc = serviceClient();
  const { data } = await svc.auth.admin.createUser({
    email: 'pw@acme.com', password: 'correct-horse-battery-staple', email_confirm: true,
  });
  await svc.from('profiles').insert({ user_id: data.user!.id, full_name: 'PW User' });
  const { data: ws } = await svc.from('workspaces').insert({
    name: 'PW Co', plan: 'entry', seat_limit: 1,
    stripe_customer_id: 'cus_pw', stripe_subscription_id: 'sub_pw',
  }).select().single();
  await svc.from('workspace_members').insert({
    workspace_id: ws!.id, user_id: data.user!.id, role: 'owner', joined_at: new Date().toISOString(),
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByPlaceholder('you@company.com').fill('pw@acme.com');
  await page.getByPlaceholder(/Password/).fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText('PW Co')).toBeVisible();
});
