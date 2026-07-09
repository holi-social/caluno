'use client';

import {
  type DiscoveryShiftInstance,
  ShiftCardDiscovery,
} from './shift-card-discovery';

export interface ShiftCardDiscoverySoloProps {
  shiftInstance: DiscoveryShiftInstance;
  conflictsWithBooked?: boolean;
}

export function ShiftCardDiscoverySolo({
  shiftInstance,
  conflictsWithBooked,
}: ShiftCardDiscoverySoloProps) {
  return (
    <ShiftCardDiscovery
      shiftInstance={shiftInstance}
      conflictsWithBooked={conflictsWithBooked}
    />
  );
}
