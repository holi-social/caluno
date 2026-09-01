'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { OrganizationUnitType } from '@repo/data';
import {
  useCurrentOrg,
  useOrganizationUnitWithSuspense,
  useOrgUId,
  useQueryClient,
} from '@repo/data/react';
import { FieldGroup } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { updateOrgUnit } from '@/domain/org-unit/actions';
import { type CreateOrgUnitFormValues, createOrgUnitSchema } from '../schemas';
import { OrgUnitFormContent } from './form-content';

interface Props {
  editOrgUnitId: string;
  types: OrganizationUnitType[];
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function EditOrgUnitForm({
  editOrgUnitId,
  types,
  onSuccess,
  onPendingChange,
  formId,
}: Props) {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrg();
  const rootOrgUnitId = useOrgUId();
  const tValidation = useTranslations('OrgUnit.validation');

  const { data: organizationUnit } =
    useOrganizationUnitWithSuspense(editOrgUnitId);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const form = useForm<CreateOrgUnitFormValues>({
    resolver: zodResolver(
      createOrgUnitSchema({
        nameMin: tValidation('nameMin'),
        typeRequired: tValidation('typeRequired'),
      }),
    ),
    defaultValues: {
      organizationUnitId: rootOrgUnitId,
      organizationId,
      name: organizationUnit?.name,
      typeId: organizationUnit?.type.id,
      websiteUrl: organizationUnit?.websiteUrl ?? undefined,
      contactEmail: organizationUnit?.contactEmail ?? undefined,
      phone: organizationUnit?.phone ?? undefined,
      description: organizationUnit?.description ?? undefined,
      address: organizationUnit?.address ?? undefined,
      city: organizationUnit?.city ?? undefined,
      zipCode: organizationUnit?.zipCode ?? undefined,
    },
  });

  const onSubmit = (formData: CreateOrgUnitFormValues) => {
    startTransition(async () => {
      const result = await updateOrgUnit(editOrgUnitId, {
        organizationUnitId: rootOrgUnitId,
        organizationId,
        name: formData.name,
        typeId: formData.typeId,
        logoFileId: formData.logoFileId,
        websiteUrl: formData.websiteUrl,
        contactEmail: formData.contactEmail,
        phone: formData.phone,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['organization-unit', editOrgUnitId],
        });
        onSuccess?.();
      }
    });
  };

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <OrgUnitFormContent
          types={types}
          isPending={isPending}
          logoPreviewUrl={organizationUnit?.logoUrl}
          formReturnValues={form}
        />
      </FieldGroup>
    </form>
  );
}
