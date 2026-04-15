'use client';

import type { RoleListItem } from '@repo/data';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { EditRoleForm } from '../forms/edit-form';

interface EditRoleSheetProps {
  role: RoleListItem;
}

export const FORM_ID = 'edit-role-form';

export function EditRoleSheet({ role }: EditRoleSheetProps) {
  const router = useRouter();
  const { setIsPending, ...sheetProps } = useSheet(FORM_ID, 'id');

  const handleSuccess = () => {
    sheetProps.close();
    router.refresh();
    toast.success('Role updated');
  };

  return (
    <ClippySheet
      {...sheetProps}
      title="Edit Role"
      description={`Update the permissions for ${role.name}.`}
      formId={FORM_ID}
    >
      <EditRoleForm
        role={role}
        onSuccess={handleSuccess}
        onPendingChange={setIsPending}
        formId={FORM_ID}
      />
    </ClippySheet>
  );
}
