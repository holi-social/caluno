import { JoinStatus, type PublicShiftInstance } from '@repo/data';
import { getLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { ShiftActionCard } from './shift-action-card';
import type { ShiftDetailShift } from './shift-detail-content';

type ShiftInstancesSectionProps = {
  shift: ShiftDetailShift;
  isAuthenticated: boolean;
  autoJoin?: boolean;
  preselectedInstanceId?: string;
};

const orderInstances = (
  instances: PublicShiftInstance[],
  preselectedInstanceId?: string,
): PublicShiftInstance[] =>
  preselectedInstanceId
    ? [
        ...instances.filter(
          (instance) => instance.id === preselectedInstanceId,
        ),
        ...instances.filter(
          (instance) => instance.id !== preselectedInstanceId,
        ),
      ]
    : instances;

export const ShiftInstancesSidebar = async ({
  shift,
  isAuthenticated,
  autoJoin,
  preselectedInstanceId,
}: ShiftInstancesSectionProps) => {
  const locale = await getLocale();
  const data = await getDataClient({ locale: resolveLocale(locale) });
  const instances = await data.shift.findPublicInstancesByShiftId(shift.id);

  return (
    <ShiftActionCard
      shiftId={shift.id}
      organizationUnitId={shift.organizationUnitId}
      instances={orderInstances(instances, preselectedInstanceId)}
      visibility={shift.visibility}
      isAuthenticated={isAuthenticated}
      autoJoin={autoJoin}
      preselectedInstanceId={preselectedInstanceId}
      masterMaxVolunteers={shift.maxVolunteers}
      membershipState={
        shift.organizationUnit?.myMembershipState ?? JoinStatus.None
      }
      shiftRequiredForms={shift.requiredForms?.map((ref) => ref.form)}
      organizationUnitRequiredForms={shift.organizationUnit?.requiredForms?.map(
        (ref) => ref.form,
      )}
    />
  );
};
