import { describe, it, expect } from 'vitest';
import { planFromPriceId, PLAN_SEAT_LIMITS } from '@/lib/plans';

describe('planFromPriceId', () => {
  const env = {
    STRIPE_PRICE_ENTRY: 'price_entry',
    STRIPE_PRICE_GROWTH: 'price_growth',
    STRIPE_PRICE_SCALE: 'price_scale',
    STRIPE_PRICE_ENTERPRISE: 'price_enterprise',
  };

  it('maps known price ids to plan ids', () => {
    expect(planFromPriceId('price_entry', env)).toBe('entry');
    expect(planFromPriceId('price_growth', env)).toBe('growth');
    expect(planFromPriceId('price_scale', env)).toBe('scale');
    expect(planFromPriceId('price_enterprise', env)).toBe('enterprise');
  });

  it('returns null for unknown price ids', () => {
    expect(planFromPriceId('price_unknown', env)).toBeNull();
  });
});

describe('PLAN_SEAT_LIMITS', () => {
  it('has the expected seat limits per tier', () => {
    expect(PLAN_SEAT_LIMITS).toEqual({
      entry: 1, growth: 3, scale: 5, enterprise: 999,
    });
  });
});
