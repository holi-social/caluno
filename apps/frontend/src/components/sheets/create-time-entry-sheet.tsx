'use client';

import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { CreateTimeEntryForm } from '@/domain/time-entry/components/create-form';
import { useSheet } from '@/hooks/use-sheet';

interface ShiftInstance {
  id: string;
  title: string;
  volunteers?: Array<{ id: string; name: string; email: string }>;
}

interface CreateTimeEntrySheetProps {
  sessionId?: string;
  shiftInstances?: ShiftInstance[];
  allVolunteers?: Array<{ id: string; name: string; email: string }>;
}

export const FORM_ID = 'create-time-entry-form';

export function CreateTimeEntrySheet({
  sessionId,
  shiftInstances = [],
  allVolunteers = [],
}: CreateTimeEntrySheetProps) {
  const { isOpen, open, close, isPending, setIsPending } = useSheet(FORM_ID);

  return (
    <ClippySheet
      isOpen={isOpen}
      open={() => open()}
      close={close}
      title="Add Time Entry"
      description="Record a new time entry for a volunteer shift session."
      isPending={isPending}
      formId={FORM_ID}
    >
      <CreateTimeEntryForm
        sessionId={sessionId}
        shiftInstances={shiftInstances}
        allVolunteers={allVolunteers}
        onSuccess={close}
        onPendingChange={setIsPending}
        formId={FORM_ID}
      />
    </ClippySheet>
  );
}
