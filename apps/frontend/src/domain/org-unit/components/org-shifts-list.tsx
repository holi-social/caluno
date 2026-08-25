import type { RawPublicOrgShift } from '@repo/data';
import { UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicListCard } from '@/components/public-list-card';
import { useRecurrenceLabel } from '@/domain/home/lib/recurrence-label';
import { shiftPublicPath } from '@/domain/shift/share';
import { useFormatting } from '@/lib/formatting/use-formatting';

interface OrgShiftsListProps {
  shifts: RawPublicOrgShift[];
}

export function OrgShiftsList({ shifts }: OrgShiftsListProps) {
  const t = useTranslations('OrgDetail');
  const { formatDate, formatTimeRange } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();

  if (shifts.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-bold text-foreground">
          {t('shiftsHeading')}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {t('shiftsCount', { n: shifts.length })}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {shifts.map((shift) => {
          const nextInstance = shift.instances[0];
          const recurrence = getRecurrenceLabel(shift.rrule);
          const spotsLeft = nextInstance?.spotsLeft;
          const unlimited = spotsLeft == null;
          const full = spotsLeft === 0;

          return (
            <PublicListCard
              key={shift.id}
              href={shiftPublicPath(shift.id, nextInstance?.id)}
              eyebrow={
                nextInstance
                  ? [
                      recurrence,
                      formatDate(new Date(nextInstance.actualStartsAt), {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      }),
                      formatTimeRange(
                        nextInstance.actualStartsAt,
                        nextInstance.actualEndsAt,
                      ),
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : undefined
              }
              title={shift.title}
              metaIcon={UsersIcon}
              metaText={
                full
                  ? t('fullyBooked')
                  : unlimited
                    ? t('unlimitedSpots')
                    : t('spotsLeft', { n: spotsLeft })
              }
              muted={full}
            />
          );
        })}
      </div>
    </section>
  );
}
