import { describe, it, expect } from 'vitest';
import { canAddSeat } from '@/lib/seats';

describe('canAddSeat', () => {
  it('allows when under limit', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 1, pendingCount: 1 })).toBe(true);
  });
  it('rejects when at limit', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 2, pendingCount: 1 })).toBe(false);
  });
  it('rejects when over limit', () => {
    expect(canAddSeat({ seatLimit: 1, activeCount: 2, pendingCount: 0 })).toBe(false);
  });
  it('treats pending invites as taking a seat', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 1, pendingCount: 2 })).toBe(false);
  });
});
