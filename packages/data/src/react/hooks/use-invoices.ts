'use client';
import {
  AccountingRepository,
  type CreateInvoiceInput,
  type EligibleTimeEntry,
  type InvoiceDetail,
  type InvoiceFilterInput,
  type InvoiceSummary,
} from '@repo/data';
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useInvoices(filter?: InvoiceFilterInput) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<InvoiceSummary[]>({
    queryKey: ['accounting', 'invoices', filter],
    queryFn: () => repository.findInvoices(filter),
    staleTime: 30 * 1000,
  });
}

export function useMyInvoices(
  filter?: InvoiceFilterInput,
  organizationUnitId?: string,
) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<InvoiceSummary[]>({
    // Keyed by organization unit: the same user's docs differ per org, and
    // the volunteer side renders one membership at a time.
    queryKey: ['accounting', 'my-invoices', filter, organizationUnitId],
    queryFn: () => repository.findMyInvoices(filter),
    staleTime: 30 * 1000,
  });
}

export function useInvoice(id?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<InvoiceDetail>({
    queryKey: ['accounting', 'invoice', id],
    queryFn: () => repository.findInvoiceById(id ?? ''),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useEligibleTimeEntriesForInvoice(input: {
  volunteerId?: string;
  reimbursementTypeId?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<EligibleTimeEntry[]>({
    queryKey: ['accounting', 'eligible-time-entries', input],
    queryFn: () =>
      repository.findEligibleTimeEntriesForInvoice({
        volunteerId: input.volunteerId ?? '',
        reimbursementTypeId: input.reimbursementTypeId ?? '',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
    staleTime: 30 * 1000,
    enabled: !!input.volunteerId && !!input.reimbursementTypeId,
  });
}

export function invalidateInvoiceQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['accounting', 'invoices'] });
  queryClient.invalidateQueries({ queryKey: ['accounting', 'my-invoices'] });
  // The cross-org "My documents" views derive from the same data.
  queryClient.invalidateQueries({ queryKey: ['accounting', 'my-documents'] });
  queryClient.invalidateQueries({
    queryKey: ['accounting', 'my-document-summary'],
  });
  queryClient.invalidateQueries({ queryKey: ['accounting', 'roster-usage'] });
  queryClient.invalidateQueries({ queryKey: ['accounting', 'yearly-usage'] });
  queryClient.invalidateQueries({
    queryKey: ['accounting', 'volunteers-needing-timesheets'],
  });
}

export function useCreateInvoice() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => repository.createInvoice(input),
    onSuccess: () => invalidateInvoiceQueries(queryClient),
  });
}

export function useSignInvoice() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (invoiceId: string) => repository.signInvoice(invoiceId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'invoice', result.id],
      });
      invalidateInvoiceQueries(queryClient);
    },
  });
}

export function useDeclineInvoice() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: ({
      invoiceId,
      reason,
    }: {
      invoiceId: string;
      reason: string;
    }) => repository.declineInvoice(invoiceId, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'invoice', result.id],
      });
      invalidateInvoiceQueries(queryClient);
    },
  });
}
