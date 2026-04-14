import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

test.beforeEach(async () => { await resetDb(); });

test('full onboarding: webhook provisions, magic link logs user in, dashboard shows plan', async ({ page, request }) => {
  const event = checkoutSessionCompleted({
    email: 'e2e@acme.com',
    companyName: 'E2E Inc.',
    priceId: process.env.STRIPE_PRICE_GROWTH!,
  });
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);

  const res = await request.post('/api/webhooks/stripe', {
    headers: { 'stripe-signature': sig, 'content-type': 'application/json' },
    data: body,
  });
  expect(res.status()).toBe(200);

  const svc = serviceClient();
  const { data } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: 'e2e@acme.com',
    options: { redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard' },
  });
  await page.goto(data!.properties!.action_link!);
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByText('E2E Inc.')).toBeVisible();
  await expect(page.getByText('Growth', { exact: false })).toBeVisible();
});
