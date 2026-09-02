'use client';
import {
  AccountingRepository,
  type MyDocumentSummaryData,
  type MyDocumentsGroupData,
} from '@repo/data';
import { useQuery } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

/**
 * The volunteer's documents across every organization they belong to,
 * grouped by organization — powers the cross-org "My documents" page. Unlike
 * the org-scoped my-contracts/my-invoices queries, this resolves the user's
 * memberships server-side, so it is not bound to an org-unit header.
 */
export function useMyDocuments() {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<MyDocumentsGroupData[]>({
    queryKey: ['accounting', 'my-documents'],
    queryFn: () => repository.findMyDocuments(),
    staleTime: 30 * 1000,
  });
}

/**
 * Summary for the "My documents" entry: whether the volunteer has any
 * documents at all (total) and how many currently need their signature
 * (pending).
 */
export function useMyDocumentSummary() {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<MyDocumentSummaryData>({
    queryKey: ['accounting', 'my-document-summary'],
    queryFn: () => repository.findMyDocumentSummary(),
    staleTime: 30 * 1000,
  });
}
