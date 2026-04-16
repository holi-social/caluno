import { ensurePlausibleInitialized, getPlausibleDomain } from '@/lib/plausible-init';
import type { Action, WizardStep } from '@/lib/types';

type WizardStepName =
  | 'check_in_intent_selection'
  | 'planned_duration_selection'
  | 'finish_arrival_time_input'
  | 'break_time_range_input'
  | 'volunteer_profile_and_consent'
  | 'thank_you_confirmation';

export type WizardFlowVariant = 'start_flow' | 'finish_flow' | 'break_flow' | 'unknown_flow';
export type WizardCheckInIntent = Action | 'unknown';
export type WizardActionType = 'view' | 'submit_success' | 'submit_error';
export type WizardErrorStage =
  | 'create_entry'
  | 'patch_entry_duration'
  | 'patch_entry_arrival'
  | 'patch_entry_break_times'
  | 'patch_entry_profile';

const STEP_NAME_BY_ID: Record<WizardStep['step'], WizardStepName> = {
  'form-1': 'check_in_intent_selection',
  'form-2-1': 'planned_duration_selection',
  'form-2-2': 'finish_arrival_time_input',
  'form-2-3': 'break_time_range_input',
  'form-3': 'volunteer_profile_and_consent',
  'form-4': 'thank_you_confirmation',
};

export function wizardStepToStepName(stepId: WizardStep['step']): WizardStepName {
  return STEP_NAME_BY_ID[stepId];
}

export function intentToFlowVariant(intent: WizardCheckInIntent): WizardFlowVariant {
  if (intent === 'starting') return 'start_flow';
  if (intent === 'finishing') return 'finish_flow';
  if (intent === 'break') return 'break_flow';
  return 'unknown_flow';
}

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

/** Unified tracking event for wizard activity. Never includes PII. */
export function trackVolunteerWizardAction(payload: {
  action_type: WizardActionType;
  step_name: WizardStepName;
  check_in_intent: WizardCheckInIntent;
  flow_variant: WizardFlowVariant;
  session_wizard_id: string;
  planned_duration_hours?: number;
  gdpr_consent_recorded?: boolean;
  error_stage?: WizardErrorStage;
}): void {
  void trackWhenEnabled('volunteer_wizard_action', {
    action_type: payload.action_type,
    step_name: payload.step_name,
    check_in_intent: payload.check_in_intent,
    flow_variant: payload.flow_variant,
    session_wizard_id: payload.session_wizard_id,
    ...(payload.planned_duration_hours !== undefined
      ? { planned_duration_hours: payload.planned_duration_hours }
      : {}),
    ...(payload.gdpr_consent_recorded !== undefined
      ? { gdpr_consent_recorded: payload.gdpr_consent_recorded }
      : {}),
    ...(payload.error_stage !== undefined ? { error_stage: payload.error_stage } : {}),
  });
}
