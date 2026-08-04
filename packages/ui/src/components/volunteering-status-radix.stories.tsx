import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserPlus, UsersRound } from 'lucide-react';
import { Badge } from '@/components/base/badge';
import { Button } from '@/components/base/button';
import { Card } from '@/components/base/card';
import {
  VolunteeringLifecyclePanel,
  VolunteeringMemberListPanel,
  VolunteeringShiftCardVolunteers,
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

const invitePanelMembers = [
  {
    id: '1',
    name: 'Konstantin Zaituc',
    email: 'testing+002@caluno.org',
    state: 'declined' as const,
  },
  {
    id: '2',
    name: 'Helena Thiomas',
    email: 'testing+006@caluno.org',
    state: 'accepted' as const,
  },
  {
    id: '3',
    name: 'Frau Ylvi Grams',
    email: 'testing+008@caluno.org',
    state: 'accepted' as const,
  },
  {
    id: '4',
    name: 'Noemi Umlauft',
    email: 'testing+010@caluno.org',
    state: 'accepted' as const,
  },
];

/** Shift calendar card — compact name + status icon (accordion). */
export const ShiftCardVolunteers: Story = {
  name: 'Shift card / invited accordion',
  render: () => (
    <Card className="mx-auto max-w-xs gap-1 overflow-hidden rounded-xl px-2 pb-2 pt-4 shadow-sm">
      <div className="flex flex-col items-end gap-2">
        <div className="flex w-full flex-col gap-1">
          <p className="text-lg font-bold leading-none text-muted-foreground">
            11:36 - 12:36
          </p>
          <p className="line-clamp-2 text-lg text-card-foreground">try 1245</p>
        </div>
        <div className="flex w-full items-start gap-1">
          <Badge variant="outline" className="flex-1 justify-center gap-1">
            <UsersRound className="size-3" />3
          </Badge>
          <Button size="icon-sm" variant="outline" aria-label="Invite">
            <UserPlus className="size-4" />
          </Button>
        </div>
      </div>
      <VolunteeringShiftCardVolunteers
        sectionLabel="Invited"
        phase="before"
        volunteers={[
          { id: '1', name: 'Sofie Gabius', state: 'accepted' },
          { id: '2', name: 'Elia Grams', state: 'accepted' },
          { id: '3', name: 'Rico Schaefer', state: 'declined' },
        ]}
      />
    </Card>
  ),
};

/** Invite sheet — searchable member list with status icons. */
export const InviteMemberPanel: Story = {
  name: 'Invite panel / member list',
  render: () => (
    <div className="mx-auto max-w-sm">
      <VolunteeringMemberListPanel
        title="Invited"
        phase="before"
        members={invitePanelMembers}
      />
    </div>
  ),
};

/** All three surfaces side by side. */
export const SurfaceComparison: Story = {
  name: 'Surfaces comparison',
  render: () => (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Shift card</p>
        <Card className="gap-1 overflow-hidden rounded-xl px-2 pb-2 pt-4 shadow-sm">
          <VolunteeringShiftCardVolunteers
            sectionLabel="Invited"
            phase="before"
            volunteers={[
              { id: '1', name: 'Sofie Gabius', state: 'accepted' },
              { id: '2', name: 'Rico Schaefer', state: 'declined' },
            ]}
          />
        </Card>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Invite panel</p>
        <VolunteeringMemberListPanel
          title="Invited"
          phase="before"
          members={invitePanelMembers.slice(0, 3)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Instance detail</p>
        <div className="rounded-xl border px-4">
          <VolunteeringVolunteerRow
            name="Tom Becker"
            state="requested"
            phase="before"
          />
        </div>
      </div>
    </div>
  ),
};
