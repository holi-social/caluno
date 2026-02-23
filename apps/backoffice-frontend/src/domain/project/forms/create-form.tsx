'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectStatus } from '@repo/data';
import { useOrgId } from '@repo/data/react';
import { Button, FieldError, FieldGroup } from '@repo/ui';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createProject } from '@/domain/project/actions';
import { type CreateProjectFormValues, createProjectSchema } from '../schemas';
import { FormContent } from './form-content';

interface CreateProjectFormProps {
  onSuccess?: () => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps = {}) {
  const router = useRouter();
  const organizationId = useOrgId();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      organizationId,
      title: '',
      description: '',
      location: '',
      startsAt: undefined,
      endsAt: undefined,
      status: ProjectStatus.Draft,
    },
  });

  const onSubmit = async (formData: CreateProjectFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createProject(formData);
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
          {isPending ? 'Creating project...' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
