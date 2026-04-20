'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Form1 } from '@/components/steps/form-1';
import { Form21 } from '@/components/steps/form-2-1';
import { Form22 } from '@/components/steps/form-2-2';
import { Form23 } from '@/components/steps/form-2-3';
import { Form3 } from '@/components/steps/form-3';
import { Form4 } from '@/components/steps/form-4';
import {
  intentToFlowVariant,
  trackVolunteerWizardAction,
  wizardStepToStepName,
  type WizardCheckInIntent,
} from '@/lib/volunteer-wizard-plausible';
import type { Action, Form3Context, WizardStep } from '@/lib/types';

// ---- Duration helpers ----

/**
 * Rounds volunteering minutes to hours:
 * - remainder < 30 min → round down (ignore minutes)
 * - remainder >= 30 min → round up (add 1 hour)
 */
function roundToNearestHour(totalMinutes: number): number {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m >= 30 ? h + 1 : h;
}

function parseHHMM(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function hoursToGerman(hours: number): string {
  if (hours <= 0) return '0 Stunden';
  return `${hours} Stunde${hours === 1 ? '' : 'n'}`;
}

function buildDurationLabel(context: Form3Context): string {
  if (context.action === 'starting') {
    return hoursToGerman(context.plannedHours);
  }

  const nowMinutes = parseHHMM(
    new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
  );

  if (context.action === 'finishing') {
    const arrivalMinutes = parseHHMM(context.arrivalTime);
    const diff = nowMinutes - arrivalMinutes;
    return hoursToGerman(roundToNearestHour(Math.max(0, diff)));
  }

  // break
  const arrivalMinutes = parseHHMM(context.arrivalTime);
  const departureMinutes = parseHHMM(context.departureTime);
  const diff = departureMinutes - arrivalMinutes;
  return hoursToGerman(roundToNearestHour(Math.max(0, diff)));
}

// ---- API helpers ----

async function createEntry(action: Action): Promise<string> {
  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to create entry');
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function patchEntry(id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update entry');
}

// ---- Wizard ----

function createSessionWizardId(): string {
  const id = globalThis.crypto?.randomUUID?.();
  if (id) return id;
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function deriveIntentFromState(
  wizardState: WizardStep,
  fallbackIntent: WizardCheckInIntent,
): WizardCheckInIntent {
  if (wizardState.step === 'form-1') return 'unknown';
  if (wizardState.step === 'form-2-1') return 'starting';
  if (wizardState.step === 'form-2-2') return 'finishing';
  if (wizardState.step === 'form-2-3') return 'break';
  if (wizardState.step === 'form-3') return wizardState.context.action;
  return fallbackIntent;
}

export default function WizardPage() {
  const [state, setState] = useState<WizardStep>({ step: 'form-1' });
  const [loading, setLoading] = useState(false);
  const sessionWizardIdRef = useRef<string>(createSessionWizardId());
  const checkInIntentRef = useRef<WizardCheckInIntent>('unknown');

  useEffect(() => {
    const checkInIntent = deriveIntentFromState(state, checkInIntentRef.current);
    checkInIntentRef.current = checkInIntent;
    trackVolunteerWizardAction({
      action_type: 'view',
      step_name: wizardStepToStepName(state.step),
      check_in_intent: checkInIntent,
      flow_variant: intentToFlowVariant(checkInIntent),
      session_wizard_id: sessionWizardIdRef.current,
    });
  }, [state.step]);

  // form-1: user picks action → create entry → go to matching form-2
  async function handleActionSelect(action: Action) {
    setLoading(true);
    checkInIntentRef.current = action;
    try {
      const entryId = await createEntry(action);
      const next: WizardStep =
        action === 'starting'
          ? { step: 'form-2-1', entryId }
          : action === 'finishing'
            ? { step: 'form-2-2', entryId }
            : { step: 'form-2-3', entryId };
      trackVolunteerWizardAction({
        action_type: 'submit_success',
        step_name: wizardStepToStepName('form-1'),
        check_in_intent: action,
        flow_variant: intentToFlowVariant(action),
        session_wizard_id: sessionWizardIdRef.current,
      });
      setState(next);
    } catch (error) {
      trackVolunteerWizardAction({
        action_type: 'submit_error',
        step_name: wizardStepToStepName('form-1'),
        check_in_intent: action,
        flow_variant: intentToFlowVariant(action),
        session_wizard_id: sessionWizardIdRef.current,
        error_stage: 'create_entry',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // form-2-1: user picks planned duration → update entry → go to form-3
  async function handleDurationSelect(hours: number) {
    if (state.step !== 'form-2-1') return;
    setLoading(true);
    checkInIntentRef.current = 'starting';
    try {
      await patchEntry(state.entryId, { plannedDurationHours: hours });
      trackVolunteerWizardAction({
        action_type: 'submit_success',
        step_name: wizardStepToStepName('form-2-1'),
        check_in_intent: 'starting',
        flow_variant: intentToFlowVariant('starting'),
        session_wizard_id: sessionWizardIdRef.current,
        planned_duration_hours: hours,
      });
      setState({
        step: 'form-3',
        entryId: state.entryId,
        context: { action: 'starting', plannedHours: hours },
      });
    } catch (error) {
      trackVolunteerWizardAction({
        action_type: 'submit_error',
        step_name: wizardStepToStepName('form-2-1'),
        check_in_intent: 'starting',
        flow_variant: intentToFlowVariant('starting'),
        session_wizard_id: sessionWizardIdRef.current,
        error_stage: 'patch_entry_duration',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // form-2-2: user enters arrival time → update entry → go to form-3
  async function handleArrivalTime(arrivalTime: string) {
    if (state.step !== 'form-2-2') return;
    setLoading(true);
    checkInIntentRef.current = 'finishing';
    try {
      await patchEntry(state.entryId, { arrivalTime });
      trackVolunteerWizardAction({
        action_type: 'submit_success',
        step_name: wizardStepToStepName('form-2-2'),
        check_in_intent: 'finishing',
        flow_variant: intentToFlowVariant('finishing'),
        session_wizard_id: sessionWizardIdRef.current,
      });
      setState({
        step: 'form-3',
        entryId: state.entryId,
        context: { action: 'finishing', arrivalTime },
      });
    } catch (error) {
      trackVolunteerWizardAction({
        action_type: 'submit_error',
        step_name: wizardStepToStepName('form-2-2'),
        check_in_intent: 'finishing',
        flow_variant: intentToFlowVariant('finishing'),
        session_wizard_id: sessionWizardIdRef.current,
        error_stage: 'patch_entry_arrival',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // form-2-3: user enters arrival + departure → update entry → go to form-3
  async function handleBreakTimes(arrivalTime: string, departureTime: string) {
    if (state.step !== 'form-2-3') return;
    setLoading(true);
    checkInIntentRef.current = 'break';
    try {
      await patchEntry(state.entryId, {
        breakArrivalTime: arrivalTime,
        breakDepartureTime: departureTime,
      });
      trackVolunteerWizardAction({
        action_type: 'submit_success',
        step_name: wizardStepToStepName('form-2-3'),
        check_in_intent: 'break',
        flow_variant: intentToFlowVariant('break'),
        session_wizard_id: sessionWizardIdRef.current,
      });
      setState({
        step: 'form-3',
        entryId: state.entryId,
        context: { action: 'break', arrivalTime, departureTime },
      });
    } catch (error) {
      trackVolunteerWizardAction({
        action_type: 'submit_error',
        step_name: wizardStepToStepName('form-2-3'),
        check_in_intent: 'break',
        flow_variant: intentToFlowVariant('break'),
        session_wizard_id: sessionWizardIdRef.current,
        error_stage: 'patch_entry_break_times',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // form-3: user submits profile → update entry → go to form-4
  async function handleProfileSubmit(
    name: string,
    email: string,
    gdprConsent: boolean,
  ) {
    if (state.step !== 'form-3') return;
    setLoading(true);
    checkInIntentRef.current = state.context.action;
    try {
      await patchEntry(state.entryId, {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        gdprConsent,
      });
      trackVolunteerWizardAction({
        action_type: 'submit_success',
        step_name: wizardStepToStepName('form-3'),
        check_in_intent: state.context.action,
        flow_variant: intentToFlowVariant(state.context.action),
        session_wizard_id: sessionWizardIdRef.current,
        gdpr_consent_recorded: gdprConsent,
      });
      setState({
        step: 'form-4',
        name: name || undefined,
        durationLabel: buildDurationLabel(state.context),
      });
    } catch (error) {
      trackVolunteerWizardAction({
        action_type: 'submit_error',
        step_name: wizardStepToStepName('form-3'),
        check_in_intent: state.context.action,
        flow_variant: intentToFlowVariant(state.context.action),
        session_wizard_id: sessionWizardIdRef.current,
        error_stage: 'patch_entry_profile',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const mainBgClass = state.step === 'form-4' ? '' : 'bg-background';
  const mainStyle =
    state.step === 'form-4'
      ? {
          background:
            'radial-gradient(ellipse at 5% -13%, #afDCFF 4%, #83D6FB 17%, #58D0F6 30%, #2CCAF2 42%, #00C4ED 55%)',
        }
      : undefined;

  return (
    <main className={`min-h-dvh flex justify-center ${mainBgClass}`} style={mainStyle}>
      <div className="relative w-full max-w-none min-h-dvh overflow-hidden pb-8">
        {state.step === 'form-1' && (
          <Form1 onSelect={handleActionSelect} loading={loading} />
        )}
        {state.step === 'form-2-1' && (
          <Form21 onSelect={handleDurationSelect} loading={loading} />
        )}
        {state.step === 'form-2-2' && (
          <Form22 onContinue={handleArrivalTime} loading={loading} />
        )}
        {state.step === 'form-2-3' && (
          <Form23 onContinue={handleBreakTimes} loading={loading} />
        )}
        {state.step === 'form-3' && (
          <Form3 onSubmit={handleProfileSubmit} loading={loading} />
        )}
        {state.step === 'form-4' && (
          <Form4 name={state.name} durationLabel={state.durationLabel} />
        )}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 py-2 pointer-events-none">
        <Link href="/impressum" className="text-xs text-muted-foreground underline underline-offset-2 pointer-events-auto">
          Impressum
        </Link>
        <Link href="/datenschutz" className="text-xs text-muted-foreground underline underline-offset-2 pointer-events-auto">
          Datenschutzhinweis
        </Link>
      </footer>
    </main>
  );
}
