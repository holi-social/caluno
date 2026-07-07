'use client';

import type { WeeklyShiftInstance } from '@repo/data';
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
import { useTranslations } from 'next-intl';
import { useSheet } from '@/hooks/use-sheet';
import { Link } from '@/i18n/navigation';
import {
  shiftInstanceDetailPath,
  type ShiftListQuery,
} from '../routes';

type ShiftCardProps = {
  instance: WeeklyShiftInstance;
  canManage?: boolean;
  orgUId?: string;
  returnQuery?: ShiftListQuery;
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
  onClick,
}: {
  count: number;
  min: number | null | undefined;
  max: number | null | undefined;
  onClick?: () => void;
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
      className={`flex-1 justify-center self-stretch gap-1${onClick ? ' cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <Icon className="size-3" />
      {text}
    </Badge>
  );
}

export function ShiftCard({
  instance,
  canManage = false,
  orgUId,
  returnQuery,
}: ShiftCardProps) {
  const inviteSheet = useSheet('invite-shift', 'id', 'instanceId');
  const t = useTranslations('Shift');

  const count = instance.volunteers?.length ?? 0;
  const min = instance.master.minVolunteers;
  const max = instance.master.maxVolunteers;
  const state = getStaffingState(count, min, max);

  const isAtCapacity = max != null && count >= max;
  const showButton = canManage && !isAtCapacity;
  const buttonVariant = state === 'alert' ? 'default' : 'outline';

  const startTime = format(new Date(instance.actualStartsAt), 'HH:mm');
  const endTime = format(new Date(instance.actualEndsAt), 'HH:mm');

  const detailHref =
    orgUId != null
      ? shiftInstanceDetailPath(
          orgUId,
          instance.master.id,
          instance.id,
          returnQuery,
        )
      : null;

  const timeAndTitle = (
    <div className="flex flex-col gap-1 w-full">
      <p className="text-lg font-bold text-muted-foreground leading-none">
        {startTime} - {endTime}
      </p>
      <p className="text-lg text-card-foreground line-clamp-2">
        {instance.master.title}
      </p>
    </div>
  );

  return (
    <Card className="rounded-xl gap-1 shadow-sm pt-4 pb-2 px-2 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 items-end">
        {detailHref ? (
          <Link
            href={detailHref}
            className="flex flex-col gap-1 w-full rounded-md hover:bg-muted/50 transition-colors -m-1 p-1"
          >
            {timeAndTitle}
          </Link>
        ) : (
          timeAndTitle
        )}

        <div className="flex gap-1 items-start w-full">
          <StaffingBadge
            count={count}
            min={min}
            max={max}
            onClick={
              showButton
                ? () =>
                    inviteSheet.open({
                      id: instance.master.id,
                      instanceId: instance.id,
                    })
                : undefined
            }
          />

          {showButton && (
            <Button
              size="icon-sm"
              variant={buttonVariant}
              aria-label={t('card.inviteAria')}
              onClick={() =>
                inviteSheet.open({
                  id: instance.master.id,
                  instanceId: instance.id,
                })
              }
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
              {t('card.invited')}
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
          {t('card.noVolunteers')}
        </p>
      )}
    </Card>
  );
}
