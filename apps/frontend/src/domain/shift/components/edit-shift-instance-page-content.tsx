import { ShiftVisibility } from '@repo/data';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { updateShiftInstance } from '../actions';
import { EditShiftInstanceForm } from './edit-shift-instance-form';

interface EditShiftInstancePageContentProps {
  orgUId: string;
  shiftId: string;
  instanceId: string;
}

export async function EditShiftInstancePageContent({
  orgUId,
  shiftId,
  instanceId,
}: EditShiftInstancePageContentProps) {
  const data = await getDataClient({ orgUId });

  const [shift, instance] = await Promise.all([
    data.shift.findByIdDetailed(shiftId),
    data.shift.findInstance(instanceId),
  ]);

  if (!shift || !instance || instance.isCancelled) {
    notFound();
  }

  return (
    <EditShiftInstanceForm
      orgUId={orgUId}
      shift={{
        id: shift.id,
        title: shift.title,
        isRecurring: !!shift.rrule && shift.recurrenceDays.length > 0,
      }}
      initialValues={{
        name: instance.overrideTitle ?? shift.title,
        startsAt: new Date(instance.actualStartsAt),
        endsAt: new Date(instance.actualEndsAt),
        location: instance.overrideLocation ?? shift.location ?? '',
        instructions: instance.overrideInstructions ?? shift.instructions ?? '',
        minVolunteers:
          instance.overrideMinVolunteers ?? shift.minVolunteers ?? undefined,
        maxVolunteers:
          instance.overrideMaxVolunteers ?? shift.maxVolunteers ?? undefined,
        openShift: shift.visibility === ShiftVisibility.AllMembers,
        recurrenceDays: shift.recurrenceDays,
        recurrenceEndsAt: shift.recurrenceEndsAt,
        imageFileId: undefined,
      }}
      initialRequiredFormIds={instance.requiredForms.map((ref) => ref.form.id)}
      imagePreviewUrl={shift.imageUrl}
      mutate={updateShiftInstance.bind(null, orgUId, instanceId)}
    />
  );
}
