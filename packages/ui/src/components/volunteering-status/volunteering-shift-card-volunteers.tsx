'use client';

import { cn } from '../../lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../base/accordion';
import type {
  ShiftVolunteeringDisplayState,
  ShiftVolunteeringPhase,
} from './types';
import { VolunteeringVolunteerCompactRow } from './volunteering-volunteer-compact-row';

export type VolunteeringShiftCardVolunteer = {
  id: string;
  name: string;
  state: ShiftVolunteeringDisplayState;
  completedDuration?: string;
};

export type VolunteeringShiftCardVolunteersProps = {
  volunteers: VolunteeringShiftCardVolunteer[];
  phase?: ShiftVolunteeringPhase;
  /** e.g. "Invited" */
  sectionLabel: string;
  emptyMessage?: string;
  className?: string;
};

/** Collapsible invited list for shift calendar cards. */
export function VolunteeringShiftCardVolunteers({
  volunteers,
  phase,
  sectionLabel,
  emptyMessage,
  className,
}: VolunteeringShiftCardVolunteersProps) {
  if (volunteers.length === 0) {
    return emptyMessage ? (
      <p className={cn('text-sm italic text-muted-foreground', className)}>
        {emptyMessage}
      </p>
    ) : null;
  }

  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="volunteers" className="border-0">
        <AccordionTrigger className="flex-row-reverse items-center justify-end gap-1 py-1 text-base font-bold hover:no-underline">
          {sectionLabel}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="flex flex-col gap-2">
            {volunteers.map((volunteer) => (
              <VolunteeringVolunteerCompactRow
                key={volunteer.id}
                name={volunteer.name}
                state={volunteer.state}
                phase={phase}
                completedDuration={volunteer.completedDuration}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
