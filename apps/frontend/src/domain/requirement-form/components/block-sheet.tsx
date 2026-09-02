'use client';

import { useCurrentOrg, useOrgUId } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { CalunoSheet } from '@/components/sheets/caluno-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { BlockForm } from './block-form';

export const BLOCK_FORM_SHEET = 'block-form';

export function BlockSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(
    BLOCK_FORM_SHEET,
    'id',
    'readOnly',
    'forForm',
  );
  const t = useTranslations('RequirementForm.blockSheet');
  const blockId = getParam('id');
  const readOnly = getParam('readOnly') === 'true';
  const forForm = getParam('forForm') === 'true';
  const isEdit = !!blockId;
  const orgUId = useOrgUId();
  const { organizationId } = useCurrentOrg();

  if (!orgUId || !organizationId) return null;

  const handleSuccess = (newBlockId: string) => {
    // Opened from the form builder in create mode: hand the new block back
    // so the builder can append it to the form.
    sheetProps.close(forForm && !isEdit ? { addBlock: newBlockId } : undefined);
  };

  return (
    <CalunoSheet
      {...sheetProps}
      title={
        readOnly ? t('viewTitle') : isEdit ? t('editTitle') : t('createTitle')
      }
      description={
        readOnly
          ? t('viewDescription')
          : isEdit
            ? t('editDescription')
            : t('createDescription')
      }
      showSaveButton={false}
      showCancelButton={false}
    >
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        }
      >
        <BlockForm
          blockId={blockId ?? undefined}
          orgUId={orgUId}
          organizationId={organizationId}
          readOnly={readOnly}
          onPendingChange={setIsPending}
          onSuccess={handleSuccess}
        />
      </Suspense>
    </CalunoSheet>
  );
}
