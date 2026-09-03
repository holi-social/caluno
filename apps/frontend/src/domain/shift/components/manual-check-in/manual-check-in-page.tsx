'use client';

import {
  useCheckInInviteToOrganization,
  useCheckInInviteToShiftInstance,
  useCheckInReadiness,
  useCheckInShiftInstances,
  useQueryClient,
} from '@repo/data/react';
import { Button, Card, CardContent } from '@repo/ui';
import { endOfMonth, startOfMonth } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { UserCard } from '@/components/user-card';
import { checkInVolunteer } from '@/domain/time-entry/actions';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { resolveCheckInReadiness } from '../../check-in-readiness';
import {
  applyDate,
  applyOrgUnit,
  applyShift,
  applyShiftInstance,
  type CheckInSelection,
  pickInitialInstance,
  toCheckInInstance,
} from '../../check-in-selection';
import { setCheckInSuccessPayload } from '../../check-in-success-dialog';
import { AcceptMembershipSheet } from './accept-membership-sheet';
import { CheckInReadinessCard } from './check-in-readiness-card';
import { DateSheet } from './date-sheet';
import { OrgUnitSheet } from './org-unit-sheet';
import { ShiftInstanceStepper } from './shift-instance-stepper';
import { ShiftSheet } from './shift-sheet';

type ManualCheckInPageProps = {
  volunteer: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  orgUnits: Array<{ id: string; name: string }>;
  initialOrgUnitId: string;
  checkInId: string;
};

export function ManualCheckInPage({
  volunteer,
  orgUnits,
  initialOrgUnitId,
  checkInId,
}: ManualCheckInPageProps) {
  const t = useTranslations('CheckIn');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatDate, formatTimeRange } = useFormatting();

  const [selection, setSelection] = useState<CheckInSelection>(() => ({
    orgUnitId: initialOrgUnitId,
    date: new Date(),
    shiftId: null,
    shiftInstanceId: null,
    selectedInstance: null,
  }));
  const [didPreselect, setDidPreselect] = useState(false);
  const [openSheet, setOpenSheet] = useState<
    'orgUnit' | 'date' | 'shift' | 'acceptMembership' | null
  >(null);

  // The visible month drives the fetch; it also feeds the calendar dots and
  // the day list, so one range query serves every consumer on the page.
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

  const { data: rawInstances } = useCheckInShiftInstances(
    selection.orgUnitId,
    startOfMonth(visibleMonth),
    endOfMonth(visibleMonth),
  );

  const instances = useMemo(
    () => (rawInstances ?? []).map(toCheckInInstance),
    [rawInstances],
  );

  // Preselect the instance nearest to now, once, after the first load.
  if (!didPreselect && rawInstances) {
    setDidPreselect(true);
    const initial = pickInitialInstance(instances, new Date());
    if (initial) {
      setSelection((current) => ({ ...current, ...initial }));
    }
  }

  // Readiness: enabled only once a shift instance is chosen. Every mutator
  // in check-in-selection.ts writes shiftInstanceId and selectedInstance
  // together, so they never disagree about which instance is current.
  const { data: readiness } = useCheckInReadiness(
    selection.orgUnitId,
    volunteer.id,
    selection.shiftInstanceId,
  );
  const readinessState = readiness
    ? resolveCheckInReadiness({
        ...readiness,
        openMembershipRequestId: readiness.openMembershipRequestId ?? null,
      })
    : null;

  // "Sent" is per (org unit) / (shift instance) — tracked as the id it was
  // sent for, so switching to a different unit or instance re-arms the
  // button instead of carrying a stale confirmation forward.
  const [orgInviteSentFor, setOrgInviteSentFor] = useState<string | null>(null);
  const [shiftInviteSentFor, setShiftInviteSentFor] = useState<string | null>(
    null,
  );
  const inviteToOrgMutation = useCheckInInviteToOrganization(
    selection.orgUnitId,
  );
  const inviteToShiftMutation = useCheckInInviteToShiftInstance(
    selection.orgUnitId,
  );

  const handleInviteToOrg = async () => {
    try {
      await inviteToOrgMutation.mutateAsync(volunteer.id);
      setOrgInviteSentFor(selection.orgUnitId);
    } catch {
      toast.error(t('notMemberError'));
    }
  };

  const handleInviteToShift = async () => {
    if (!selection.shiftInstanceId) return;
    try {
      await inviteToShiftMutation.mutateAsync({
        shiftInstanceId: selection.shiftInstanceId,
        volunteerId: volunteer.id,
      });
      setShiftInviteSentFor(selection.shiftInstanceId);
    } catch {
      toast.error(t('notInShiftError'));
    }
  };

  const [isSubmitPending, startSubmitTransition] = useTransition();

  const handleSubmit = () => {
    startSubmitTransition(async () => {
      const result = await checkInVolunteer({
        organizationUnitId: selection.orgUnitId,
        volunteerId: volunteer.id,
        shiftInstanceId: selection.shiftInstanceId,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        await queryClient.invalidateQueries({
          queryKey: ['check-in-readiness'],
        });
        return;
      }

      const startsAt = selection.selectedInstance
        ? new Date(selection.selectedInstance.actualStartsAt)
        : null;
      const isToday =
        !!startsAt && startsAt.toDateString() === new Date().toDateString();

      setCheckInSuccessPayload({
        volunteerName: volunteer.name,
        volunteerImage: volunteer.image ?? null,
        shiftTitle: selection.selectedInstance?.title ?? null,
        timeRange: selection.selectedInstance
          ? formatTimeRange(
              selection.selectedInstance.actualStartsAt,
              selection.selectedInstance.actualEndsAt,
            )
          : null,
        dateLabel: startsAt
          ? isToday
            ? t('today')
            : formatDate(startsAt)
          : null,
      });
      router.push('/check-in');
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft />
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold">
            {t('checkInRunningTitle')}
          </h1>
          <div className="size-9 shrink-0" />
        </div>

        <ShiftInstanceStepper
          selection={selection}
          orgUnits={orgUnits}
          onOpenOrgUnit={() => setOpenSheet('orgUnit')}
          onOpenDate={() => {
            setVisibleMonth(selection.date ?? new Date());
            setOpenSheet('date');
          }}
          onOpenShift={() => setOpenSheet('shift')}
        />

        <UserCard user={volunteer} size="lg" />

        {selection.shiftInstanceId && readinessState && (
          <CheckInReadinessCard
            state={readinessState}
            checkInId={checkInId}
            onInviteToOrg={handleInviteToOrg}
            onOpenAcceptMembership={() => setOpenSheet('acceptMembership')}
            onInviteToShift={handleInviteToShift}
            isInviteToOrgPending={inviteToOrgMutation.isPending}
            isInviteToOrgSent={orgInviteSentFor === selection.orgUnitId}
            isInviteToShiftPending={inviteToShiftMutation.isPending}
            isInviteToShiftSent={
              shiftInviteSentFor === selection.shiftInstanceId
            }
          />
        )}

        {readinessState === 'ready' && (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={isSubmitPending}
            onClick={handleSubmit}
          >
            {t('checkInButton')}
          </Button>
        )}

        <OrgUnitSheet
          open={openSheet === 'orgUnit'}
          onOpenChange={(open) => setOpenSheet(open ? 'orgUnit' : null)}
          orgUnits={orgUnits}
          selectedOrgUnitId={selection.orgUnitId}
          onSelect={(orgUnitId) =>
            setSelection((current) => applyOrgUnit(current, orgUnitId))
          }
        />

        <DateSheet
          open={openSheet === 'date'}
          onOpenChange={(open) => setOpenSheet(open ? 'date' : null)}
          instances={instances}
          selectedDate={selection.date}
          selectedShiftId={selection.shiftId}
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          onSelect={(date) =>
            setSelection((current) =>
              applyDate(current, date, instances, new Date()),
            )
          }
        />

        <ShiftSheet
          open={openSheet === 'shift'}
          onOpenChange={(open) => setOpenSheet(open ? 'shift' : null)}
          orgUnitId={selection.orgUnitId}
          instances={instances}
          selectedDate={selection.date}
          selectedShiftInstanceId={selection.shiftInstanceId}
          onSelectInstance={(instance) =>
            setSelection((current) => applyShiftInstance(current, instance))
          }
          onSelectShift={(shiftId) =>
            setSelection((current) =>
              applyShift(current, shiftId, instances, new Date()),
            )
          }
        />

        <AcceptMembershipSheet
          open={openSheet === 'acceptMembership'}
          onOpenChange={(open) =>
            setOpenSheet(open ? 'acceptMembership' : null)
          }
          organizationUnitId={selection.orgUnitId}
          volunteerId={volunteer.id}
          membershipRequestId={readiness?.openMembershipRequestId ?? null}
          onAccepted={() => setOpenSheet(null)}
        />
      </CardContent>
    </Card>
  );
}
