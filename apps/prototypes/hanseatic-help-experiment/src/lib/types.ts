export type Action = 'starting' | 'finishing' | 'break';

export type Entry = {
  id: string;
  action: Action;
  // Starting flow
  plannedDurationHours?: number;
  // Finishing flow
  arrivalTime?: string; // HH:MM
  // Break flow
  breakArrivalTime?: string;   // HH:MM
  breakDepartureTime?: string; // HH:MM
  // Profile (form-3) — optional
  name?: string;
  email?: string;
  gdprConsent?: boolean;
  // Metadata
  createdAt: string;
  updatedAt: string;
};

// ---- Wizard state machine ----

// Context carried from form-2 into form-3 so we can compute the duration label
export type Form3Context =
  | { action: 'starting'; plannedHours: number }
  | { action: 'finishing'; arrivalTime: string }
  | { action: 'break'; arrivalTime: string; departureTime: string };

export type WizardStep =
  | { step: 'form-1' }
  | { step: 'form-2-1'; entryId: string }
  | { step: 'form-2-2'; entryId: string }
  | { step: 'form-2-3'; entryId: string }
  | { step: 'form-3'; entryId: string; context: Form3Context }
  | { step: 'form-4'; name: string | undefined; durationLabel: string };

export const STEP_PROGRESS: Record<WizardStep['step'], number> = {
  'form-1': 25,
  'form-2-1': 50,
  'form-2-2': 50,
  'form-2-3': 50,
  'form-3': 75,
  'form-4': 100,
};
