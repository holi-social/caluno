'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrgUId } from '@repo/data/react';
import { FieldError, FieldGroup } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createRole } from '@/domain/role/actions';
import {
  type CreateRoleFormValues,
  createRoleSchema,
} from '@/domain/role/schemas';
import { FormContent } from './form-content';

interface CreateRoleFormProps {
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
  formId?: string;
}

export function CreateRoleForm({
  onSuccess,
  onPendingChange,
  formId,
}: CreateRoleFormProps) {
  const router = useRouter();
  const organizationUnitId = useOrgUId();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const form = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      organizationUnitId,
      name: '',
      description: '',
      permissionIds: [],
    },
  });

  const onSubmit = async (formData: CreateRoleFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createRole(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.();
        router.refresh();
      }
    });
  };

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col h-full"
    >
      <FieldGroup>
        <FormContent isPending={isPending} formReturnValues={form} />
        {serverError && <FieldError>{serverError}</FieldError>}
      </FieldGroup>
    </form>
  );
}
