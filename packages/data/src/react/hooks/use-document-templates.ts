'use client';
import {
  AccountingRepository,
  type CreateDocumentTemplateInput,
  type DocumentKind,
  type DocumentTemplateDetail,
  type DocumentTemplateSummary,
  type UpdateDocumentTemplateInput,
} from '@repo/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useDocumentTemplates() {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<DocumentTemplateSummary[]>({
    queryKey: ['accounting', 'document-templates'],
    queryFn: () => repository.findDocumentTemplates(),
    staleTime: 30 * 1000,
  });
}

export function useDocumentTemplate(id?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<DocumentTemplateDetail>({
    queryKey: ['accounting', 'document-template', id],
    queryFn: () => repository.findDocumentTemplateById(id ?? ''),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useActiveDocumentTemplate(
  kind?: DocumentKind,
  reimbursementTypeId?: string,
  organizationUnitId?: string,
) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<DocumentTemplateDetail>({
    queryKey: [
      'accounting',
      'active-document-template',
      kind,
      reimbursementTypeId,
      organizationUnitId,
    ],
    queryFn: () =>
      repository.findActiveDocumentTemplate({
        kind: kind as DocumentKind,
        reimbursementTypeId: reimbursementTypeId ?? '',
        organizationUnitId,
      }),
    staleTime: 30 * 1000,
    enabled: !!kind && !!reimbursementTypeId,
  });
}

export function useCreateDocumentTemplate() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (input: CreateDocumentTemplateInput) =>
      repository.createDocumentTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'document-templates'],
      });
    },
  });
}

export function useUpdateDocumentTemplate() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDocumentTemplateInput;
    }) => repository.updateDocumentTemplate(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'document-template', result.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'document-templates'],
      });
    },
  });
}

export function useDeleteDocumentTemplate() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (id: string) => repository.deleteDocumentTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'document-templates'],
      });
    },
  });
}
