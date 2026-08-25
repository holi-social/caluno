interface SpotsInstance {
  spotsLeft?: number | null;
}

interface SpotsShift {
  instances: SpotsInstance[];
}

export interface EventSpotsSummary {
  /** True when at least one shift instance exists. */
  hasInstances: boolean;
  /** Sum of spotsLeft across capped (non-unlimited) instances. */
  totalSpotsLeft: number;
  /** True when any instance has unlimited (null) capacity — an accurate
   *  spots-left count can't be shown, since it would ignore that instance. */
  hasUnlimited: boolean;
  /** True when there's at least one instance and none of them have room. */
  fullyBooked: boolean;
}

/** Aggregates spots-left across all of an event's shift instances. */
export function getEventSpotsSummary(shifts: SpotsShift[]): EventSpotsSummary {
  const instanceSpotsLeft = shifts.flatMap((shift) =>
    shift.instances.map((instance) => instance.spotsLeft ?? null),
  );
  const cappedSpotsLeft = instanceSpotsLeft.filter(
    (spots): spots is number => spots != null,
  );
  const hasInstances = instanceSpotsLeft.length > 0;
  const totalSpotsLeft = cappedSpotsLeft.reduce((sum, spots) => sum + spots, 0);
  const hasUnlimited = instanceSpotsLeft.some((spots) => spots == null);

  return {
    hasInstances,
    totalSpotsLeft,
    hasUnlimited,
    fullyBooked: hasInstances && totalSpotsLeft === 0 && !hasUnlimited,
  };
}
