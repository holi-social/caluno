'use client';

import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { CreateRoleForm } from '@/domain/role/forms/create-form';
import { useSheet } from '@/hooks/use-sheet';

export const FORM_ID = 'create-role-form';

export function CreateRoleSheet() {
  const { isOpen, open, close, isPending, setIsPending } = useSheet(FORM_ID);

  return (
    <ClippySheet
      isOpen={isOpen}
      open={() => open()}
      close={close}
      isPending={isPending}
      title="Create Role"
      description="Define a new role with specific permissions."
      formId={FORM_ID}
    >
      <CreateRoleForm
        onSuccess={close}
        onPendingChange={setIsPending}
        formId={FORM_ID}
      />
    </ClippySheet>
  );
}
