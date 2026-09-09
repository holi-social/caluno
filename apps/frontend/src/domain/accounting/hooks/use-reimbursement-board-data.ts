'use client';

import {
  useContracts,
  useInvoices,
  useRosterYearlyUsage,
  useVolunteersNeedingTimesheets,
} from '@repo/data/react';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import type { DateRange } from '../components/period-picker';
import { boardYear, buildBoardVolunteers } from '../lib/board-data.utils';

interface UseReimbursementBoardDataInput {
  orgUId: string;
  dateRange?: DateRange;
  year?: number;
}

export function useReimbursementBoardData({
  orgUId,
  dateRange,
  year,
}: UseReimbursementBoardDataInput) {
  const locale = useLocale();
  const resolvedYear = year ?? boardYear(dateRange);

  const periodStart = useMemo(
    () => new Date(resolvedYear, 0, 1).toISOString(),
    [resolvedYear],
  );
  const periodEnd = useMemo(
    () => new Date(resolvedYear + 1, 0, 1).toISOString(),
    [resolvedYear],
  );

  const rosterQuery = useRosterYearlyUsage(orgUId, resolvedYear);
  const contractsQuery = useContracts({
    periodStart,
    periodEnd,
  });
  const invoicesQuery = useInvoices({
    periodStart,
    periodEnd,
  });
  const needsTimesheetQuery = useVolunteersNeedingTimesheets({
    periodStart,
    periodEnd,
  });

  const volunteers = useMemo(() => {
    if (!rosterQuery.data) return [];
    // Volunteer id -> reimbursement type ids they have eligible hours for.
    // Used to synthesize a `contract-generate` row when a volunteer has
    // eligible hours but no contract yet — see buildBoardVolunteers.
    const eligibleHoursVolunteers = new Map<string, Set<string>>();
    for (const entry of needsTimesheetQuery.data ?? []) {
      const types =
        eligibleHoursVolunteers.get(entry.volunteer.id) ?? new Set();
      types.add(entry.reimbursementType.id);
      eligibleHoursVolunteers.set(entry.volunteer.id, types);
    }
    return buildBoardVolunteers({
      rosterUsage: rosterQuery.data,
      contracts: contractsQuery.data ?? [],
      invoices: invoicesQuery.data ?? [],
      year: resolvedYear,
      locale,
      dateRange,
      eligibleHoursVolunteers,
    });
  }, [
    rosterQuery.data,
    contractsQuery.data,
    invoicesQuery.data,
    needsTimesheetQuery.data,
    resolvedYear,
    locale,
    dateRange,
  ]);

  return {
    volunteers,
    isLoading:
      rosterQuery.isLoading ||
      contractsQuery.isLoading ||
      invoicesQuery.isLoading ||
      needsTimesheetQuery.isLoading,
    error:
      rosterQuery.error ??
      contractsQuery.error ??
      invoicesQuery.error ??
      needsTimesheetQuery.error,
  };
}
