'use client';

import { useCheckInShiftInstances } from '@repo/data/react';
import { Button, Card, CardContent } from '@repo/ui';
import { endOfMonth, startOfMonth } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { UserCard } from '@/components/user-card';
import { useRouter } from '@/i18n/navigation';
import {
  applyOrgUnit,
  type CheckInSelection,
  pickInitialInstance,
  toCheckInInstance,
} from '../../check-in-selection';
import { OrgUnitSheet } from './org-unit-sheet';
import { ShiftInstanceStepper } from './shift-instance-stepper';

type ManualCheckInPageProps = {
  volunteer: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  orgUnits: Array<{ id: string; name: string }>;
  initialOrgUnitId: string;
};

export function ManualCheckInPage({
  volunteer,
  orgUnits,
  initialOrgUnitId,
}: ManualCheckInPageProps) {
  const t = useTranslations('CheckIn');
  const router = useRouter();

  const [selection, setSelection] = useState<CheckInSelection>(() => ({
    orgUnitId: initialOrgUnitId,
    date: new Date(),
    shiftId: null,
    shiftInstanceId: null,
  }));
  const [didPreselect, setDidPreselect] = useState(false);
  const [openSheet, setOpenSheet] = useState<
    'orgUnit' | 'date' | 'shift' | null
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
          instances={instances}
          onOpenOrgUnit={() => setOpenSheet('orgUnit')}
          onOpenDate={() => {}}
          onOpenShift={() => {}}
        />

        <UserCard user={volunteer} size="lg" />

        <OrgUnitSheet
          open={openSheet === 'orgUnit'}
          onOpenChange={(open) => setOpenSheet(open ? 'orgUnit' : null)}
          orgUnits={orgUnits}
          selectedOrgUnitId={selection.orgUnitId}
          onSelect={(orgUnitId) =>
            setSelection((current) => applyOrgUnit(current, orgUnitId))
          }
        />
      </CardContent>
    </Card>
  );
}
