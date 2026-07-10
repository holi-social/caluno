'use client';

import { useCurrentOrg, useOrgUId } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { BlockForm } from './block-form';

export const BLOCK_FORM_SHEET = 'block-form';

export function BlockSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(
    BLOCK_FORM_SHEET,
    'id',
    'readOnly',
  );
  const t = useTranslations('RequirementForm.blockSheet');
  const blockId = getParam('id');
  const readOnly = getParam('readOnly') === 'true';
  const isEdit = !!blockId;
  const orgUId = useOrgUId();
  const { organizationId } = useCurrentOrg();

  if (!orgUId || !organizationId) return null;

  const handleSuccess = () => {
    sheetProps.close();
  };

  return (
    <ClippySheet
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
    </ClippySheet>
  );
}
