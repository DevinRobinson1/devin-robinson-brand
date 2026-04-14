export type SeatCounts = {
  seatLimit: number;
  activeCount: number;
  pendingCount: number;
};

export function canAddSeat({ seatLimit, activeCount, pendingCount }: SeatCounts): boolean {
  return activeCount + pendingCount < seatLimit;
}
