'use client';

import type { OrganizationUnitType } from '@repo/data';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { CalunoSheet } from '@/components/sheets/caluno-sheet';
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
  const t = useTranslations('OrgUnit');
  const tCommon = useTranslations('Common');

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(isEdit ? t('toast.updated') : t('toast.created'));
  };

  return (
    <CalunoSheet
      {...sheetProps}
      title={isEdit ? t('sheet.editTitle') : t('sheet.createTitle')}
      description={
        isEdit ? t('sheet.editDescription') : t('sheet.createDescription')
      }
      formId={FORM_ID}
    >
      {editOrgUnitId ? (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              {tCommon('loading')}
            </p>
          }
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
    </CalunoSheet>
  );
}
