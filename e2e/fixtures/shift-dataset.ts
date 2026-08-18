export type Recurrence =
  | 'Does not repeat'
  | 'Every day'
  | 'Every working day'
  | 'Every weekend day'
  | 'Custom recurrence';

export interface ShiftSpec {
  name: string;
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  weekdays?: string[]; // only for "Custom recurrence" (e.g. ['Mo','We','Fr'])
  openShift: boolean;
  location?: string;
  instructions?: string;
}

// Varied shift specs (Open ON/OFF, different times/locations); `runId` keeps names
// unique. Created shifts (with ids) are persisted for the All Shifts suite.
export function buildShiftDataset(runId: string): ShiftSpec[] {
  return [
    {
      name: `E2E Shift Open Morning ${runId}`,
      startTime: '09:00',
      endTime: '17:00',
      recurrence: 'Does not repeat',
      openShift: true,
      location: 'Main Hall',
      instructions: 'Standard morning shift',
    },
    {
      name: `E2E Shift Closed Kitchen ${runId}`,
      startTime: '08:00',
      endTime: '12:00',
      recurrence: 'Does not repeat',
      openShift: false,
      location: 'Kitchen',
    },
    {
      name: `E2E Shift Open Afternoon ${runId}`,
      startTime: '10:00',
      endTime: '18:00',
      recurrence: 'Does not repeat',
      openShift: true,
      location: 'Reception',
      instructions: 'Afternoon coverage',
    },
    {
      name: `E2E Shift Closed Session ${runId}`,
      startTime: '13:00',
      endTime: '16:00',
      recurrence: 'Does not repeat',
      openShift: false,
      instructions: 'Invite-only session',
    },
    {
      name: `E2E Shift Open Early ${runId}`,
      startTime: '07:30',
      endTime: '11:30',
      recurrence: 'Does not repeat',
      openShift: true,
      location: 'Warehouse',
    },
  ];
}
