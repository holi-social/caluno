export interface UnderstaffedTickInput {
  belowMinimum: boolean;
  hoursUntilStart: number;
  callOutAlreadyFired: boolean;
  reminderAlreadyFired: boolean;
  reminderThresholdHours: number;
}

export interface UnderstaffedTickDecision {
  /** True when the instance is back at/above minimum: the 48h call-out re-arms (its "fired" state is cleared) for the next crossing. */
  rearm: boolean;
  fireCallOut: boolean;
  fireReminder: boolean;
}

/**
 * Pure state-transition logic for one instance on one scheduler tick — the
 * single hourly poll is the only trigger path (no event-driven dropout
 * hook), so this function is the whole rulebook for when the 48h call-out and
 * the 24h reminder fire, re-fire, or stay silent.
 */
export function decideUnderstaffedTick(
  input: UnderstaffedTickInput,
): UnderstaffedTickDecision {
  if (!input.belowMinimum) {
    return { rearm: true, fireCallOut: false, fireReminder: false };
  }

  const fireCallOut = !input.callOutAlreadyFired;
  const fireReminder =
    !input.reminderAlreadyFired &&
    input.hoursUntilStart <= input.reminderThresholdHours;

  return { rearm: false, fireCallOut, fireReminder };
}
