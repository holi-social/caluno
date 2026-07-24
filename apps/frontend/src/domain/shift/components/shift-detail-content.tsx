import {
  JoinStatus,
  type PublicShiftInstance,
  type ShiftVisibility,
} from '@repo/data';
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRecurrenceLabel } from '@/domain/home/lib/recurrence-label';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { ShiftActionCard } from './shift-action-card';

interface Shift {
  id: string;
  organizationUnitId: string;
  title: string;
  instructions?: string | null;
  location?: string | null;
  rrule?: string | null;
  originalStartsAt: string;
  durationMinutes: number;
  visibility: ShiftVisibility;
  organizationUnit?: { myMembershipState: JoinStatus } | null;
}

interface ShiftDetailContentProps {
  shift: Shift;
  instances: PublicShiftInstance[];
  isAuthenticated: boolean;
  autoJoin?: boolean;
  preselectedInstanceId?: string;
}

export function ShiftDetailContent({
  shift,
  instances,
  isAuthenticated,
  autoJoin,
  preselectedInstanceId,
}: ShiftDetailContentProps) {
  const t = useTranslations('ShiftDetail');
  const { formatTimeRange, formatDate } = useFormatting();
  const getRecurrenceLabel = useRecurrenceLabel();
  const recurrence = getRecurrenceLabel(shift.rrule);
  const start = new Date(shift.originalStartsAt);
  const end = new Date(start.getTime() + shift.durationMinutes * 60000);

  const orderedInstances = preselectedInstanceId
    ? [
        ...instances.filter((i) => i.id === preselectedInstanceId),
        ...instances.filter((i) => i.id !== preselectedInstanceId),
      ]
    : instances;

  return (
    <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
      <div className="flex flex-col md:flex-row md:gap-12">
        <aside className="order-1 min-w-0 md:order-2 md:w-[392px] md:shrink-0">
          <ShiftActionCard
            shiftId={shift.id}
            organizationUnitId={shift.organizationUnitId}
            instances={orderedInstances}
            visibility={shift.visibility}
            isAuthenticated={isAuthenticated}
            autoJoin={autoJoin}
            preselectedInstanceId={preselectedInstanceId}
            membershipState={
              shift.organizationUnit?.myMembershipState ?? JoinStatus.None
            }
          />
        </aside>

        <div className="order-2 mt-6 min-w-0 md:order-1 md:mt-0 md:max-w-[680px] md:flex-1">
          {shift.instructions ? (
            <>
              <section>
                <h2 className="text-xl font-bold text-foreground">
                  {t('whatYouDoHeading')}
                </h2>
                <p className="mt-3 whitespace-pre-line text-lg text-muted-foreground">
                  {shift.instructions}
                </p>
              </section>
              <hr className="my-8 border-border" />
            </>
          ) : null}

          <section>
            <h2 className="text-xl font-bold text-foreground">
              {t('whenWhereHeading')}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 size-5 shrink-0 text-foreground" />
                <p className="text-lg text-muted-foreground">
                  {formatTimeRange(start.toISOString(), end.toISOString())}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="mt-0.5 size-5 shrink-0 text-foreground" />
                <p className="text-lg text-muted-foreground">
                  {recurrence ??
                    formatDate(start, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })}
                </p>
              </div>
              {shift.location ? (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 size-5 shrink-0 text-foreground" />
                  <p className="whitespace-pre-line text-lg text-muted-foreground">
                    {shift.location}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
