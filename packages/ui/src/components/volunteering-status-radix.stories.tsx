import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  VolunteeringLifecyclePanel,
  VolunteeringStatusBadge,
  VolunteeringStatusIcon,
  VolunteeringVolunteerList,
  VolunteeringVolunteerRow,
} from '@/components/volunteering-status';
import type { ShiftVolunteeringDisplayState } from '@/components/volunteering-status/types';

const meta = {
  title: 'ui/Volunteering lifecycle',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function LifecycleSection({
  title,
  subtitle,
  states,
  phase,
}: {
  title: string;
  subtitle: string;
  states: ShiftVolunteeringDisplayState[];
  phase?: 'before' | 'during' | 'after';
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-2">
        {states.map((state) => (
          <VolunteeringLifecyclePanel
            key={state}
            state={state}
            phase={phase}
            completedDuration={state === 'completed' ? '3h 57m' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

/** Reference board — all lifecycle states with descriptions and CTAs. */
export const LifecycleReferenceBoard: Story = {
  name: 'Lifecycle reference board',
  render: () => (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <LifecycleSection
        title="Before shift"
        subtitle="Status depends on how they joined."
        phase="before"
        states={['invited', 'requested', 'accepted', 'declined']}
      />
      <LifecycleSection
        title="During shift"
        subtitle="Check-in for accepted volunteers. Hover other badges for why."
        phase="during"
        states={[
          'checked_in',
          'not_checked_in',
          'invited',
          'requested',
          'declined',
        ]}
      />
      <LifecycleSection
        title="After shift"
        subtitle="Final status is inferred automatically."
        phase="after"
        states={[
          'completed',
          'no_show',
          'invited_never_responded',
          'requested_never_responded',
          'declined',
        ]}
      />
    </div>
  ),
};

/** Colored icons alone — reusable signal outside badges. */
export const StatusIcons: Story = {
  name: 'Status icons (reusable)',
  render: () => (
    <div className="flex max-w-xl flex-wrap items-center gap-6">
      {(
        [
          'invited',
          'requested',
          'accepted',
          'declined',
          'checked_in',
          'not_checked_in',
          'completed',
          'no_show',
        ] as const
      ).map((state) => (
        <div key={state} className="flex flex-col items-center gap-2">
          <VolunteeringStatusIcon state={state} size="md" accessible />
          <span className="text-xs text-muted-foreground">{state}</span>
        </div>
      ))}
    </div>
  ),
};

/** All badge variants in isolation. */
export const StatusBadges: Story = {
  name: 'Status badges',
  render: () => (
    <div className="flex max-w-xl flex-wrap gap-2">
      {(
        [
          'invited',
          'requested',
          'accepted',
          'declined',
          'checked_in',
          'not_checked_in',
          'completed',
          'no_show',
          'invited_never_responded',
          'requested_never_responded',
        ] as const
      ).map((state) => (
        <VolunteeringStatusBadge
          key={state}
          state={state}
          completedDuration={state === 'completed' ? '3h 57m' : undefined}
        />
      ))}
    </div>
  ),
};

const sampleVolunteers = [
  { id: '1', name: 'Katharina Zimmer', state: 'accepted' as const },
  { id: '2', name: 'Hans Test', state: 'invited' as const },
  { id: '3', name: 'Lena Müller', state: 'declined' as const },
  { id: '4', name: 'Tom Becker', state: 'requested' as const },
  { id: '5', name: 'Sara Klein', state: 'accepted' as const },
];

/** Detail page volunteers card — before shift (matches product mockup). */
export const DetailPageBeforeShift: Story = {
  name: 'Detail page / before shift',
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VolunteeringVolunteerList
        phase="before"
        summary="5 invited · 12 spots"
        volunteers={sampleVolunteers}
      />
    </div>
  ),
};

/** During shift — accepted volunteers tracked; others passive (no CTA). */
export const DetailPageDuringShift: Story = {
  name: 'Detail page / during shift',
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VolunteeringVolunteerList
        phase="during"
        summary="2 checked in · 5 accepted"
        volunteers={[
          { id: '1', name: 'Katharina Zimmer', state: 'checked_in' },
          { id: '2', name: 'Hans Test', state: 'not_checked_in' },
          { id: '3', name: 'Lena Müller', state: 'invited' },
          { id: '4', name: 'Tom Becker', state: 'requested' },
          { id: '5', name: 'Sara Klein', state: 'declined' },
        ]}
      />
    </div>
  ),
};

/** After shift — inferred timesheet states. */
export const DetailPageAfterShift: Story = {
  name: 'Detail page / after shift',
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VolunteeringVolunteerList
        phase="after"
        summary="1 completed · 1 no-show"
        volunteers={[
          {
            id: '1',
            name: 'Katharina Zimmer',
            state: 'completed',
            completedDuration: '3h 57m',
          },
          { id: '2', name: 'Hans Test', state: 'no_show' },
          { id: '3', name: 'Lena Müller', state: 'invited_never_responded' },
          { id: '4', name: 'Tom Becker', state: 'declined' },
        ]}
      />
    </div>
  ),
};

/** Single row playground. */
export const SingleRow: Story = {
  name: 'Single volunteer row',
  render: () => (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rounded-xl border px-4">
        <VolunteeringVolunteerRow
          name="Tom Becker"
          state="requested"
          phase="before"
          onAction={() => {}}
        />
      </div>
      <div className="rounded-xl border px-4">
        <VolunteeringVolunteerRow
          name="Katharina Zimmer"
          state="accepted"
          phase="before"
          onAction={() => {}}
        />
      </div>
    </div>
  ),
};
