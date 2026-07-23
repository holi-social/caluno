import { cn } from '../../lib/utils';
import { Badge } from '../base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../base/card';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringVolunteerRow } from './volunteering-volunteer-row';

export type VolunteeringVolunteerListItem = {
  id: string;
  name: string;
  image?: string | null;
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
};

export type VolunteeringVolunteerListProps = {
  volunteers: VolunteeringVolunteerListItem[];
  phase?: ShiftVolunteeringPhase;
  /** Header summary, e.g. "5 invited · 12 spots". */
  summary?: string;
  className?: string;
};

export function VolunteeringVolunteerList({
  volunteers,
  phase,
  summary,
  className,
}: VolunteeringVolunteerListProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className="border-b py-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <span>Volunteers</span>
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
          />
        ))}
      </CardContent>
    </Card>
  );
}
