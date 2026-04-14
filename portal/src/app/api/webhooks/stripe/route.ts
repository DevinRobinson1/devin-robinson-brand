import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCheckoutSession } from '@/lib/webhook-parser';
import { planFromPriceId } from '@/lib/plans';
import {
  provisionWorkspaceFromCheckout,
  applySubscriptionUpdate,
  markSubscriptionCanceled,
} from '@/lib/provisioning';
import { sendMagicLinkEmail } from '@/lib/resend';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new NextResponse('missing signature', { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`signature verification failed: ${err.message}`, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('webhook_events').select('stripe_event_id').eq('stripe_event_id', event.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await admin.from('webhook_events').insert({
    stripe_event_id: event.id, type: event.type, payload: event as any,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const full = process.env.STRIPE_WEBHOOK_TEST_MODE === '1'
          ? session
          : await stripe().checkout.sessions.retrieve(session.id, {
              expand: ['line_items', 'customer_details'],
            });
        const parsed = parseCheckoutSession(full as any);
        const plan = planFromPriceId(parsed.priceId, process.env as any);
        if (!plan) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/alert`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'unknown_price_id', priceId: parsed.priceId }),
          });
          return new NextResponse('unknown price_id', { status: 500 });
        }
        const result = await provisionWorkspaceFromCheckout(parsed, plan);

        const { data: link } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: parsed.email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` },
        });
        if (link?.properties?.action_link) {
          await sendMagicLinkEmail({
            to: parsed.email,
            magicLink: link.properties.action_link,
            planDisplayName: plan.charAt(0).toUpperCase() + plan.slice(1),
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId, process.env as any) : null;
        if (plan) await applySubscriptionUpdate(sub.id, plan);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await markSubscriptionCanceled(sub.id);
        break;
      }
    }
  } catch (err: any) {
    await admin.from('audit_log').insert({
      action: 'webhook.failed',
      metadata: { event_id: event.id, error: err.message },
    });
    return new NextResponse(`handler error: ${err.message}`, { status: 500 });
  }

  await admin.from('webhook_events').update({ processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id);
  return NextResponse.json({ ok: true });
}
