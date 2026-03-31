'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { RoleListItem } from '@repo/data';
import { useOrgUId } from '@repo/data/react';
import { Button, FieldError, FieldGroup } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { updateRole } from '@/domain/role/actions';
import {
  type CreateRoleFormValues,
  createRoleSchema,
} from '@/domain/role/schemas';
import { FormContent } from './form-content';

interface EditRoleFormProps {
  role: RoleListItem;
  onSuccess?: () => void;
}

export function EditRoleForm({ role, onSuccess }: EditRoleFormProps) {
  const router = useRouter();
  const organizationUnitId = useOrgUId();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const updateRoleWithId = updateRole.bind(null, role.id);

  const form = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      organizationUnitId,
      name: role.name,
      description: role.description ?? '',
      permissionIds: role.permissions.map((p) => p.id),
    },
  });

  const onSubmit = async (formData: CreateRoleFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await updateRoleWithId(formData);
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
      onSubmit={form.handleSubmit(onSubmit)}
      className="relative flex flex-col h-full"
    >
      <div className="flex-1 pb-20">
        <FieldGroup>
          <FormContent isPending={isPending} formReturnValues={form} />
          {serverError && <FieldError>{serverError}</FieldError>}
        </FieldGroup>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
