export type PlanId = 'entry' | 'growth' | 'scale' | 'enterprise';

export const PLAN_SEAT_LIMITS: Record<PlanId, number> = {
  entry: 1, growth: 3, scale: 5, enterprise: 999,
};

export type StripePriceEnv = {
  STRIPE_PRICE_ENTRY: string;
  STRIPE_PRICE_GROWTH: string;
  STRIPE_PRICE_SCALE: string;
  STRIPE_PRICE_ENTERPRISE: string;
};

export function planFromPriceId(priceId: string, env: StripePriceEnv): PlanId | null {
  if (priceId === env.STRIPE_PRICE_ENTRY) return 'entry';
  if (priceId === env.STRIPE_PRICE_GROWTH) return 'growth';
  if (priceId === env.STRIPE_PRICE_SCALE) return 'scale';
  if (priceId === env.STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return null;
}
