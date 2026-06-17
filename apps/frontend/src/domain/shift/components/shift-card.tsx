'use client';

import type { WeeklyShiftInstance } from '@repo/data';
import { useOrgUId } from '@repo/data/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
} from '@repo/ui';
import { format } from 'date-fns';
import { TriangleAlert, UserPlus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useSheet } from '@/hooks/use-sheet';

type ShiftCardProps = {
  instance: WeeklyShiftInstance;
  canManage?: boolean;
};

function getStaffingState(
  count: number,
  min: number | null | undefined,
  max: number | null | undefined,
) {
  if (max != null && count >= max) {
    return 'full' as const;
  }
  if (count === 0 || (min != null && count < min)) {
    return 'alert' as const;
  }
  return 'neutral' as const;
}

function StaffingBadge({
  count,
  min,
  max,
}: {
  count: number;
  min: number | null | undefined;
  max: number | null | undefined;
}) {
  const state = getStaffingState(count, min, max);

  const variant =
    state === 'full' ? 'success' : state === 'alert' ? 'alert' : 'outline';

  const showTriangle =
    state === 'alert' && min != null && count < min && count > 0;
  const Icon = showTriangle ? TriangleAlert : UsersRound;

  let text: string;
  if (state === 'full' && max != null) {
    text = `${max}/${max}`;
  } else if (state === 'alert' && min != null && count > 0) {
    text = `${count}/${min}`;
  } else if (max != null) {
    text = `${count}/${max}`;
  } else {
    text = `${count}`;
  }

  return (
    <Badge
      variant={variant}
      className="flex-1 justify-center self-stretch gap-1"
    >
      <Icon className="size-3" />
      {text}
    </Badge>
  );
}

export function ShiftCard({ instance, canManage = false }: ShiftCardProps) {
  const orgUId = useOrgUId();
  const inviteSheet = useSheet('invite-shift', 'id');

  const count = instance.volunteers?.length ?? 0;
  const min = instance.master.minVolunteers;
  const max = instance.master.maxVolunteers;
  const state = getStaffingState(count, min, max);

  const isAtCapacity = max != null && count >= max;
  const showButton = canManage && !isAtCapacity;
  const buttonVariant = state === 'alert' ? 'default' : 'outline';

  const startTime = format(new Date(instance.actualStartsAt), 'HH:mm');
  const endTime = format(new Date(instance.actualEndsAt), 'HH:mm');

  return (
    <Card className="rounded-xl gap-1 shadow-sm pt-4 pb-2 px-2 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 items-end">
        <div className="flex flex-col gap-1 w-full">
          <p className="text-lg font-bold text-muted-foreground leading-none">
            {startTime} - {endTime}
          </p>

          <Link
            className="hover:underline block"
            href={`/admin/${orgUId}/shifts/${instance.master.id}`}
          >
            <p className="text-lg text-card-foreground">
              {instance.master.title}
            </p>
          </Link>
        </div>

        <div className="flex gap-1 items-start w-full">
          <StaffingBadge count={count} min={min} max={max} />

          {showButton && (
            <Button
              size="icon-sm"
              variant={buttonVariant}
              aria-label="Invite volunteers"
              onClick={() => inviteSheet.open({ id: instance.master.id })}
            >
              <UserPlus className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Accordion with volunteer list */}
      {count > 0 ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="volunteers" className="border-0">
            <AccordionTrigger className="items-center py-1 text-base font-bold hover:no-underline flex-row-reverse justify-end gap-1">
              Invited
            </AccordionTrigger>

            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-2">
                {(instance.volunteers ?? []).map(({ id, name }) => (
                  <p key={id} className="text-base truncate">
                    {name}
                  </p>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No volunteers invited
        </p>
      )}
    </Card>
  );
}
