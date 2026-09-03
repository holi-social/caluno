export type Recurrence =
  | 'Does not repeat'
  | 'Every day'
  | 'Every working day'
  | 'Every weekend day'
  | 'Custom recurrence';

export interface Shift {
  name: string;
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  weekdays?: string[]; // only for "Custom recurrence" (e.g. ['Mo','We','Fr'])
  openShift: boolean;
  location?: string;
  instructions?: string;
}

// One non-recurring + one recurring shift to cover both create paths.
export function buildShifts(runId: string): Shift[] {
  return [
    {
      name: `E2E Non-recurring Shift ${runId}`,
      startTime: '09:00',
      endTime: '17:00',
      recurrence: 'Does not repeat',
      openShift: true,
      location: 'Main Hall',
      instructions: 'Standard one-off shift',
    },
    {
      name: `E2E Recurring Shift ${runId}`,
      startTime: '08:00',
      endTime: '12:00',
      recurrence: 'Custom recurrence',
      weekdays: ['Mo', 'We', 'Fr'],
      openShift: false,
      location: 'Kitchen',
      instructions: 'Weekly recurring, invite-only',
    },
  ];
}
