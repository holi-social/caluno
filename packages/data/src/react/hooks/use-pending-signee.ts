'use client';
import { AccountingRepository, type RawPendingSignee } from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function usePendingContractSignee(contractId?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawPendingSignee>({
    queryKey: ['accounting', 'pending-contract-signee', contractId],
    queryFn: () => repository.findPendingContractSignee(contractId ?? ''),
    staleTime: 30 * 1000,
    enabled: !!contractId,
  });
}

export function usePendingInvoiceSignee(invoiceId?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<RawPendingSignee>({
    queryKey: ['accounting', 'pending-invoice-signee', invoiceId],
    queryFn: () => repository.findPendingInvoiceSignee(invoiceId ?? ''),
    staleTime: 30 * 1000,
    enabled: !!invoiceId,
  });
}
