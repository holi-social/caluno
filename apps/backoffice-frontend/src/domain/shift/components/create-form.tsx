'use client';

import type { ProjectListItem } from '@repo/data';
import { useOrgId } from '@repo/data/react';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface CreateShiftFormProps {
  projects: ProjectListItem[];
  onSuccess?: (shiftId: string) => void;
}

export function CreateShiftForm({ onSuccess, projects }: CreateShiftFormProps) {
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const orgId = useOrgId();

  // Extract projectId from URL if we're on a project page or deeper
  const projectId = pathname?.match(/\/projects\/([^/]+)/)?.[1];
  const initialValues = projectId ? { projectId } : undefined;

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift({
        ...formData,
        ...{
          projectId:
            formData.projectId === 'none' ? undefined : formData.projectId,
        },
      });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.(result.data?.id ?? '');
      }
    });
  };

  return (
    <>
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <ShiftForm
        organizationId={orgId}
        projects={projects}
        onSubmit={onSubmit}
        isPending={isPending}
        initialValues={initialValues}
      />
    </>
  );
}
