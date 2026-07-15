'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { OrganizationUnitType } from '@repo/data';
import { useCurrentOrg, useOrgUId } from '@repo/data/react';
import { FieldGroup } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createOrgUnit } from '@/domain/org-unit/actions';
import { type CreateOrgUnitFormValues, createOrgUnitSchema } from '../schemas';
import { OrgUnitFormContent } from './form-content';

interface Props {
  parentId: string;
  types: OrganizationUnitType[];
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function CreateOrgUnitForm({
  parentId,
  types,
  onSuccess,
  onPendingChange,
  formId,
}: Props) {
  const organizationUnitId = useOrgUId();
  const { organizationId } = useCurrentOrg();
  const tValidation = useTranslations('OrgUnit.validation');

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
      organizationUnitId,
      organizationId,
      name: '',
      typeId: types[0]?.id,
    },
  });

  const onSubmit = (formData: CreateOrgUnitFormValues) => {
    startTransition(async () => {
      const result = await createOrgUnit(parentId, {
        organizationUnitId,
        organizationId,
        name: formData.name,
        typeId: formData.typeId,
        logoUrl: formData.logoUrl,
        websiteUrl: formData.websiteUrl,
        contactEmail: formData.contactEmail,
        phone: formData.phone,
        description: formData.description,
        address: formData.address,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
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
