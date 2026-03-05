'use client';

import type { ProjectListItem } from '@repo/data';
import { type GetShiftQuery, ShiftVisibility } from '@repo/data/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { ShiftForm } from './shift-form';

interface EditShiftFormProps {
  orgId: string;
  shift: GetShiftQuery['shift'];
  projects: ProjectListItem[];
}

export function EditShiftForm({ orgId, shift, projects }: EditShiftFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await updateShift({
        ...formData,
        ...{
          id: shift.id,
          projectId:
            formData.projectId === 'none' ? undefined : formData.projectId,
        },
      });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        router.push(`/${orgId}/shifts`);
      }
    });
  };

  const shiftFormValues = {
    organizationId: orgId,
    name: shift.title,
    instructions: shift.instructions || undefined,
    location: shift.location || undefined,
    startsAt: new Date(shift.startsAt).toLocaleString(),
    endsAt: new Date(shift.endsAt).toLocaleString(),
    openShift: shift.visibility === ShiftVisibility.AllMembers,
    projectId: shift.project?.id,
    invitedMemberIds: shift.volunteers?.map((v) => v.id),
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
        onSubmit={onSubmit}
        isPending={isPending}
        initialValues={shiftFormValues}
        projects={projects}
      />
    </>
  );
}
