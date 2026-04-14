import { ensurePlausibleInitialized, getPlausibleDomain } from '@/lib/plausible-init';
import type { Action, WizardStep } from '@/lib/types';

const STEP_VIEW_ROW_ID = 'step_view_pending';
const STEP_VIEW_NEXT_NAME = 'Step view only (see Step Completed for next step)';
const STEP_VIEW_COMPLETED_NAME = 'Step view only (see Step Completed for completed step)';
const STEP_VIEW_CHECK_IN_INTENT = 'not_applicable_step_view';

/** Human-readable step names for Plausible custom properties (English, stable for reporting). */
export const WIZARD_STEP_NAMES: Record<WizardStep['step'], string> = {
  'form-1': 'Check-in type (start, finish, or manual times)',
  'form-2-1': 'Planned volunteering duration',
  'form-2-2': 'Arrival time when finishing',
  'form-2-3': 'Manual start and end times',
  'form-3': 'Volunteer name, email, and consent',
  'form-4': 'Thank-you confirmation',
};

function toPlausibleProps(
  input: Record<string, string | number | boolean | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
  }
  return out;
}

async function trackWhenEnabled(
  eventName: string,
  props: Record<string, string | number | boolean | undefined | null>,
): Promise<void> {
  if (!getPlausibleDomain() || typeof window === 'undefined') return;
  await ensurePlausibleInitialized();
  const { track } = await import('@plausible-analytics/tracker');
  track(eventName, { props: toPlausibleProps(props) });
}

/** Fires when the user lands on a wizard screen (including the first load). */
export function trackVolunteerWizardStepViewed(stepId: WizardStep['step']): void {
  void trackWhenEnabled('VolunteerCheckInWizardStepViewed', {
    wizard_step_id: stepId,
    wizard_step_name: WIZARD_STEP_NAMES[stepId],
    completed_step_id: STEP_VIEW_ROW_ID,
    completed_step_name: STEP_VIEW_COMPLETED_NAME,
    check_in_intent: STEP_VIEW_CHECK_IN_INTENT,
    next_step_id: STEP_VIEW_ROW_ID,
    next_step_name: STEP_VIEW_NEXT_NAME,
  });
}

/** Fires after a successful transition (API ok, state updated). Never includes PII. */
export function trackVolunteerWizardStepCompleted(payload: {
  completed_step_id: WizardStep['step'];
  next_step_id: WizardStep['step'];
  /** Always set so `check_in_intent` is never missing on completion rows. */
  check_in_intent: Action;
  planned_duration_hours?: number;
  gdpr_consent_recorded?: boolean;
}): void {
  void trackWhenEnabled('VolunteerCheckInWizardStepCompleted', {
    completed_step_id: payload.completed_step_id,
    completed_step_name: WIZARD_STEP_NAMES[payload.completed_step_id],
    wizard_step_id: payload.completed_step_id,
    wizard_step_name: WIZARD_STEP_NAMES[payload.completed_step_id],
    next_step_id: payload.next_step_id,
    next_step_name: WIZARD_STEP_NAMES[payload.next_step_id],
    check_in_intent: payload.check_in_intent,
    ...(payload.planned_duration_hours !== undefined
      ? { planned_duration_hours: payload.planned_duration_hours }
      : {}),
    ...(payload.gdpr_consent_recorded !== undefined
      ? { gdpr_consent_recorded: payload.gdpr_consent_recorded }
      : {}),
  });
}
