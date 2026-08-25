'use client';

import { type FieldType, RequiredFormTargetType } from '@repo/data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationRepository } from '../../repositories/organization/organization.repository';
import { RequirementFormRepository } from '../../repositories/requirementForm/requirement-form.repository';
import { useSdk } from './use-graphql-client';

export type RequiredFormField = {
  id: string;
  blockId: string;
  type: FieldType;
  label: string;
  placeholder?: string | null;
  description?: string | null;
  required: boolean;
  lockType: boolean;
  systemKey?: string | null;
  documentFileId?: string | null;
  documentDownloadUrl?: string | null;
  documentFilename?: string | null;
  documentLabel?: string | null;
  minAge?: number | null;
  fieldOrder: number;
  options?: Array<{ label: string; value: string }> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RequiredFormBlock = {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  required: boolean;
  isEditable: boolean;
  fields?: Array<RequiredFormField> | null;
};

export type RequiredFormBlockRef = {
  id: string;
  formId: string;
  blockId: string;
  fieldOrder: number;
  required?: boolean | null;
  block?: RequiredFormBlock | null;
};

export type RequiredForm = {
  id: string;
  name: string;
  description?: string | null;
  settings?: {
    submitButtonLabel?: string | null;
    successTitle?: string | null;
    successMessage?: string | null;
  } | null;
  blockRefs?: Array<RequiredFormBlockRef> | null;
};

export function useSetRequiredForms() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new OrganizationRepository(sdk);

  return useMutation({
    mutationFn: ({
      organizationUnitId,
      formIds,
    }: {
      organizationUnitId: string;
      formIds: string[];
    }) => repository.setRequiredForms(organizationUnitId, formIds),
    onSuccess: (_, { organizationUnitId }) => {
      queryClient.invalidateQueries({
        queryKey: ['organization-unit', organizationUnitId],
      });
    },
  });
}

export function useSubmitRequiredForm() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new RequirementFormRepository(sdk);

  return useMutation({
    mutationFn: ({
      targetType,
      targetId,
      formId,
      values,
    }: {
      targetType: RequiredFormTargetType;
      targetId: string;
      formId: string;
      values: Array<{ fieldId: string; blockId: string; value: string }>;
    }) =>
      repository.submitRequiredForm(targetType, targetId, formId, { values }),
    onSuccess: (_, { targetType, targetId }) => {
      if (targetType === RequiredFormTargetType.OrganizationUnit) {
        queryClient.invalidateQueries({
          queryKey: ['organization-unit', targetId],
        });
      }
      if (targetType === RequiredFormTargetType.Event) {
        queryClient.invalidateQueries({
          queryKey: ['publicEvent', targetId],
        });
        queryClient.invalidateQueries({
          queryKey: ['event', targetId],
        });
      }
    },
  });
}
