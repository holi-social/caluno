import { cn } from '../../lib/utils';
import { Badge } from '../base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../base/card';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
  VolunteeringActionLabel,
} from './types';
import type { VolunteeringActionLabels } from './volunteering-action-buttons';
import { VolunteeringVolunteerRow } from './volunteering-volunteer-row';

export type VolunteeringVolunteerListItem = {
  id: string;
  name: string;
  image?: string | null;
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
  statusLabel?: string;
  /** When set, overrides default actions from status presentation. */
  actions?: VolunteeringActionLabel[];
  /** Far-right icon-only actions (e.g. View profile, Check in). */
  iconActions?: VolunteeringActionLabel[];
};

export type VolunteeringVolunteerListProps = {
  volunteers: VolunteeringVolunteerListItem[];
  phase?: ShiftVolunteeringPhase;
  /** Card title, defaults to "Volunteers". */
  title?: string;
  /** Header summary, e.g. "5 invited · 12 spots". */
  summary?: string;
  /** Localized button labels keyed by action id. */
  actionLabels?: VolunteeringActionLabels;
  onAction?: (
    volunteerId: string,
    action: import('./types').VolunteeringActionLabel,
  ) => void;
  className?: string;
};

export function VolunteeringVolunteerList({
  volunteers,
  phase,
  title = 'Volunteers',
  summary,
  actionLabels,
  onAction,
  className,
}: VolunteeringVolunteerListProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className="border-b py-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <span>{title}</span>
          {summary ? (
            <span className="text-sm font-normal text-muted-foreground">
              {summary}
            </span>
          ) : (
            <Badge variant="outline">{volunteers.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-0">
        {volunteers.map((volunteer) => (
          <VolunteeringVolunteerRow
            key={volunteer.id}
            name={volunteer.name}
            image={volunteer.image}
            state={volunteer.state}
            phase={phase}
            completedDuration={volunteer.completedDuration}
            statusLabel={volunteer.statusLabel}
            actions={volunteer.actions}
            iconActions={volunteer.iconActions}
            actionLabels={actionLabels}
            onAction={
              onAction ? (action) => onAction(volunteer.id, action) : undefined
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}
