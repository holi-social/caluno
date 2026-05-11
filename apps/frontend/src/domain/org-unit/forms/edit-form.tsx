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

  const { data: organizationUnit } =
    useOrganizationUnitWithSuspense(editOrgUnitId);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const form = useForm<CreateOrgUnitFormValues>({
    resolver: zodResolver(createOrgUnitSchema),
    defaultValues: {
      organizationUnitId: rootOrgUnitId,
      organizationId,
      name: organizationUnit?.name,
      typeId: organizationUnit?.type.id,
      logoUrl: organizationUnit?.logoUrl ?? undefined,
      websiteUrl: organizationUnit?.websiteUrl ?? undefined,
      email: organizationUnit?.email ?? undefined,
      phone: organizationUnit?.phone ?? undefined,
      description: organizationUnit?.description ?? undefined,
      address: organizationUnit?.address ?? undefined,
    },
  });

  const onSubmit = (formData: CreateOrgUnitFormValues) => {
    startTransition(async () => {
      const result = await updateOrgUnit(editOrgUnitId, {
        organizationUnitId: rootOrgUnitId,
        organizationId,
        name: formData.name,
        typeId: formData.typeId,
        logoUrl: formData.logoUrl,
        websiteUrl: formData.websiteUrl,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        address: formData.address,
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
          formReturnValues={form}
        />
      </FieldGroup>
    </form>
  );
}
