import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserPlus, UsersRound } from 'lucide-react';
import { Badge } from '@/components/base/badge';
import { Button } from '@/components/base/button';
import { Card } from '@/components/base/card';
import {
  VolunteeringMemberListPanel,
  VolunteeringShiftCardVolunteers,
  VolunteeringStatusBadge,
  VolunteeringStatusIcon,
  VolunteeringVolunteerList,
  VolunteeringVolunteerRow,
} from '@/components/volunteering-status';
import type { ShiftVolunteeringDisplayState } from '@/components/volunteering-status/types';

/** Coordinator-visible invite response states (maps to ShiftInstanceInvite). */
const INVITE_FLOW_STATES = [
  'invited',
  'accepted',
  'declined',
  'cancelled',
] as const satisfies readonly ShiftVolunteeringDisplayState[];

const SIGNUP_FLOW_STATES = [
  'signed_up',
] as const satisfies readonly ShiftVolunteeringDisplayState[];

function StatusFlowSection({
  title,
  description,
  states,
  variant,
}: {
  title: string;
  description?: string;
  states: readonly ShiftVolunteeringDisplayState[];
  variant: 'icon' | 'badge';
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {states.map((state) => (
          <div key={state} className="flex flex-col items-center gap-2">
            {variant === 'icon' ? (
              <VolunteeringStatusIcon state={state} accessible />
            ) : (
              <VolunteeringStatusBadge state={state} />
            )}
            {variant === 'icon' ? (
              <span className="text-base text-muted-foreground">{state}</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

const meta = {
  title: 'ui/Shift invite status',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const invitedVolunteers = [
  { id: '1', name: 'Katharina Zimmer', state: 'accepted' as const },
  { id: '2', name: 'Hans Test', state: 'invited' as const },
  { id: '3', name: 'Lena Müller', state: 'declined' as const },
  { id: '4', name: 'Sara Klein', state: 'cancelled' as const },
  { id: '5', name: 'Tom Weber', state: 'signed_up' as const },
];

const invitePanelMembers = [
  {
    id: '1',
    name: 'Konstantin Zaituc',
    email: 'member002@clippy.social',
    state: 'declined' as const,
  },
  {
    id: '2',
    name: 'Helena Thiomas',
    email: 'member006@clippy.social',
    state: 'accepted' as const,
  },
  {
    id: '3',
    name: 'Frau Ylvi Grams',
    email: 'member008@clippy.social',
    state: 'invited' as const,
  },
  {
    id: '4',
    name: 'Noemi Umlauft',
    email: 'member012@clippy.social',
    state: 'accepted' as const,
  },
];

/** Icons grouped by how the volunteer joined the shift. */
export const StatusIcons: Story = {
  name: 'Status icons',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-8">
      <StatusFlowSection
        title="Org invites volunteer"
        description="Coordinator sends invite → volunteer responds (or coordinator cancels)."
        states={INVITE_FLOW_STATES}
        variant="icon"
      />
      <StatusFlowSection
        title="Volunteer signs up for shift"
        description="No invite — volunteer joins directly; lands on shift immediately."
        states={SIGNUP_FLOW_STATES}
        variant="icon"
      />
    </div>
  ),
};

/** Badge labels grouped by how the volunteer joined the shift. */
export const StatusBadges: Story = {
  name: 'Status badges',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-8">
      <StatusFlowSection
        title="Org invites volunteer"
        description="Coordinator sends invite → volunteer responds (or coordinator cancels)."
        states={INVITE_FLOW_STATES}
        variant="badge"
      />
      <StatusFlowSection
        title="Volunteer signs up for shift"
        description="No invite — volunteer joins directly; lands on shift immediately."
        states={SIGNUP_FLOW_STATES}
        variant="badge"
      />
    </div>
  ),
};

/** Shift instance detail — invited volunteers with status. */
export const InstanceDetail: Story = {
  name: 'Instance detail',
  render: () => (
    <div className="mx-auto max-w-2xl">
      <VolunteeringVolunteerList
        summary="4 invited · 2 accepted · 1 signed up · 12 spots"
        volunteers={invitedVolunteers}
      />
    </div>
  ),
};

/** Shift calendar card — compact invite list with status icons. */
export const ShiftCard: Story = {
  name: 'Shift card',
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
        volunteers={[
          { id: '1', name: 'Sofie Gabius', state: 'accepted' },
          { id: '2', name: 'Elia Grams', state: 'invited' },
          { id: '3', name: 'Rico Schaefer', state: 'declined' },
          { id: '4', name: 'Jan Vogel', state: 'cancelled' },
          { id: '5', name: 'Tom Weber', state: 'signed_up' },
        ]}
      />
    </Card>
  ),
};

/** Invite sheet — searchable list with per-member status. */
export const InvitePanel: Story = {
  name: 'Invite panel',
  render: () => (
    <div className="mx-auto max-w-sm">
      <VolunteeringMemberListPanel
        title="Invited"
        members={invitePanelMembers}
      />
    </div>
  ),
};

/** All three backoffice surfaces. */
export const Surfaces: Story = {
  name: 'All surfaces',
  render: () => (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Shift card</p>
        <Card className="gap-1 overflow-hidden rounded-xl px-2 pb-2 pt-4 shadow-sm">
          <VolunteeringShiftCardVolunteers
            sectionLabel="Invited"
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
          members={invitePanelMembers.slice(0, 3)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Instance detail</p>
        <div className="rounded-xl border px-4">
          <VolunteeringVolunteerRow
            name="Katharina Zimmer"
            state="accepted"
            onAction={() => {}}
          />
          <VolunteeringVolunteerRow name="Tom Weber" state="signed_up" />
        </div>
      </div>
    </div>
  ),
};
