import { describe, it, expect } from 'vitest';
import { parseCheckoutSession } from '@/lib/webhook-parser';

const base = {
  id: 'cs_test_123',
  customer: 'cus_123',
  subscription: 'sub_123',
  customer_email: 'alice@acme.com',
  customer_details: { name: 'Alice A', email: 'alice@acme.com' },
  custom_fields: [
    { key: 'company_name', text: { value: 'Acme Inc.' } },
  ],
  line_items: { data: [{ price: { id: 'price_growth' } }] },
};

describe('parseCheckoutSession', () => {
  it('extracts fields with company name', () => {
    const result = parseCheckoutSession(base as any);
    expect(result).toEqual({
      email: 'alice@acme.com',
      fullName: 'Alice A',
      companyName: 'Acme Inc.',
      priceId: 'price_growth',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });
  });

  it('falls back to "<email>\'s workspace" when company_name missing', () => {
    const session = { ...base, custom_fields: [] };
    const result = parseCheckoutSession(session as any);
    expect(result.companyName).toBe("alice@acme.com's workspace");
  });

  it('throws if required fields missing', () => {
    expect(() => parseCheckoutSession({ ...base, customer_email: null, customer_details: { name: 'Alice A', email: null } } as any)).toThrow();
    expect(() => parseCheckoutSession({ ...base, line_items: { data: [] } } as any)).toThrow();
  });
});
