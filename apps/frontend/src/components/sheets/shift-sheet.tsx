'use client';

import { useOrgUId } from '@repo/data/react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { CreateShiftForm } from '@/domain/shift/components/create-form';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { useSheet } from '@/hooks/use-sheet';

export const FORM_ID = 'shift-form';

export function ShiftSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(FORM_ID, 'id');
  const shiftId = getParam('id');
  const isEdit = !!shiftId;
  const orgUId = useOrgUId();
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(isEdit ? 'Shift Updated' : 'Shift created');
  };

  return (
    <ClippySheet
      {...sheetProps}
      title={isEdit ? 'Edit shift' : 'Create shift'}
      description={isEdit ? 'Edit shift.' : 'Create a new shift.'}
      formId={FORM_ID}
    >
      {shiftId ? (
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <EditShiftForm
            orgUId={orgUId}
            shiftId={shiftId}
            onSuccess={handleSuccess}
            onPendingChange={setIsPending}
            formId={FORM_ID}
          />
        </Suspense>
      ) : (
        <CreateShiftForm formId={FORM_ID} onPendingChange={setIsPending} />
      )}
    </ClippySheet>
  );
}
