/**
 * Selection rules for the volunteering check-in page: which org unit, date,
 * shift and shift instance are currently chosen, and how choosing one of them
 * invalidates the others.
 *
 * Kept free of React and of the generated GraphQL types so the two Figma edge
 * cases (changing the date clears an impossible shift; choosing a shift that
 * does not run that day clears the date) are unit-testable.
 */

export type CheckInInstance = {
  id: string;
  masterId: string;
  title: string;
  actualStartsAt: string;
  actualEndsAt: string;
};

export type CheckInSelection = {
  orgUnitId: string;
  date: Date | null;
  shiftId: string | null;
  shiftInstanceId: string | null;
};

type RawInstance = {
  id: string;
  actualStartsAt: string;
  actualEndsAt: string;
  overrideTitle?: string | null;
  master: { id: string; title: string };
};

export function toCheckInInstance(raw: RawInstance): CheckInInstance {
  return {
    id: raw.id,
    masterId: raw.master.id,
    title: raw.overrideTitle ?? raw.master.title,
    actualStartsAt: raw.actualStartsAt,
    actualEndsAt: raw.actualEndsAt,
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function instancesOnDate(
  instances: CheckInInstance[],
  date: Date,
): CheckInInstance[] {
  return instances.filter((i) => isSameDay(new Date(i.actualStartsAt), date));
}

/**
 * The instance a human would most likely mean right now: one that is already
 * running, else the one starting nearest to `now`.
 */
function closestToNow(
  instances: CheckInInstance[],
  now: Date,
): CheckInInstance | null {
  if (instances.length === 0) return null;

  const running = instances.find((i) => {
    const start = new Date(i.actualStartsAt).getTime();
    const end = new Date(i.actualEndsAt).getTime();
    return start <= now.getTime() && now.getTime() <= end;
  });
  if (running) return running;

  return instances.reduce((best, candidate) => {
    const distance = Math.abs(
      new Date(candidate.actualStartsAt).getTime() - now.getTime(),
    );
    const bestDistance = Math.abs(
      new Date(best.actualStartsAt).getTime() - now.getTime(),
    );
    return distance < bestDistance ? candidate : best;
  });
}

export function pickInitialInstance(
  instances: CheckInInstance[],
  now: Date,
): { shiftId: string; shiftInstanceId: string } | null {
  const today = closestToNow(instancesOnDate(instances, now), now);
  if (!today) return null;

  return { shiftId: today.masterId, shiftInstanceId: today.id };
}

export function applyOrgUnit(
  selection: CheckInSelection,
  orgUnitId: string,
): CheckInSelection {
  return {
    ...selection,
    orgUnitId,
    shiftId: null,
    shiftInstanceId: null,
  };
}

export function applyDate(
  selection: CheckInSelection,
  date: Date,
  instances: CheckInInstance[],
  now: Date,
): CheckInSelection {
  if (!selection.shiftId) {
    return { ...selection, date, shiftInstanceId: null };
  }

  const match = closestToNow(
    instancesOnDate(instances, date).filter(
      (i) => i.masterId === selection.shiftId,
    ),
    now,
  );

  if (!match) {
    return { ...selection, date, shiftId: null, shiftInstanceId: null };
  }

  return { ...selection, date, shiftInstanceId: match.id };
}

export function applyShift(
  selection: CheckInSelection,
  shiftId: string,
  instances: CheckInInstance[],
  now: Date,
): CheckInSelection {
  const match = selection.date
    ? closestToNow(
        instancesOnDate(instances, selection.date).filter(
          (i) => i.masterId === shiftId,
        ),
        now,
      )
    : null;

  if (!match) {
    return { ...selection, shiftId, date: null, shiftInstanceId: null };
  }

  return { ...selection, shiftId, shiftInstanceId: match.id };
}

export function applyShiftInstance(
  selection: CheckInSelection,
  instance: CheckInInstance,
): CheckInSelection {
  return {
    ...selection,
    date: new Date(instance.actualStartsAt),
    shiftId: instance.masterId,
    shiftInstanceId: instance.id,
  };
}
