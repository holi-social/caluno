'use client';

import type { OrganizationUnitType } from '@repo/data';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';
import { CreateOrgUnitForm } from '../forms/create-form';
import { EditOrgUnitForm } from '../forms/edit-form';

export const FORM_ID = 'org-unit-create-edit-form';

interface Props {
  types: OrganizationUnitType[];
}

export function OrgUnitCreateEditSheet({ types }: Props) {
  const router = useRouter();
  const { setIsPending, getParam, ...sheetProps } = useSheet(
    FORM_ID,
    'id',
    'parentId',
  );

  const editOrgUnitId = getParam('id');
  const parentOrgUnitId = getParam('parentId');
  const isEdit = !!editOrgUnitId;

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(
      isEdit ? 'Organization unit updated' : 'Organization unit created',
    );
  };

  return (
    <ClippySheet
      {...sheetProps}
      title={isEdit ? 'Edit organization unit' : 'Create organization unit'}
      description={
        isEdit ? 'Edit organization unit.' : 'Create a new organization unit.'
      }
      formId={FORM_ID}
    >
      {editOrgUnitId ? (
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <EditOrgUnitForm
            editOrgUnitId={editOrgUnitId}
            types={types}
            onSuccess={handleSuccess}
            onPendingChange={setIsPending}
            formId={FORM_ID}
          />
        </Suspense>
      ) : (
        parentOrgUnitId && (
          <CreateOrgUnitForm
            parentId={parentOrgUnitId}
            types={types}
            onSuccess={handleSuccess}
            onPendingChange={setIsPending}
            formId={FORM_ID}
          />
        )
      )}
    </ClippySheet>
  );
}
