'use client';

import {
  useContracts,
  useInvoices,
  useRosterYearlyUsage,
} from '@repo/data/react';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import type { DateRange } from '../components/period-picker';
import { boardYear, buildBoardVolunteers } from '../lib/board-data.utils';

interface UseReimbursementBoardDataInput {
  orgUId: string;
  dateRange?: DateRange;
}

export function useReimbursementBoardData({
  orgUId,
  dateRange,
}: UseReimbursementBoardDataInput) {
  const locale = useLocale();
  const year = boardYear(dateRange);

  const periodStart = useMemo(() => new Date(year, 0, 1).toISOString(), [year]);
  const periodEnd = useMemo(
    () => new Date(year + 1, 0, 1).toISOString(),
    [year],
  );

  const rosterQuery = useRosterYearlyUsage(orgUId, year);
  const contractsQuery = useContracts({
    periodStart,
    periodEnd,
  });
  const invoicesQuery = useInvoices({
    periodStart,
    periodEnd,
  });

  const volunteers = useMemo(() => {
    if (!rosterQuery.data) return [];
    return buildBoardVolunteers({
      rosterUsage: rosterQuery.data,
      contracts: contractsQuery.data ?? [],
      invoices: invoicesQuery.data ?? [],
      year,
      locale,
      dateRange,
    });
  }, [
    rosterQuery.data,
    contractsQuery.data,
    invoicesQuery.data,
    year,
    locale,
    dateRange,
  ]);

  return {
    volunteers,
    isLoading:
      rosterQuery.isLoading ||
      contractsQuery.isLoading ||
      invoicesQuery.isLoading,
    error: rosterQuery.error ?? contractsQuery.error ?? invoicesQuery.error,
  };
}
