'use client';

import { useCurrentOrg, useOrgUId } from '@repo/data/react';
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
  const blockId = getParam('id');
  const readOnly = getParam('readOnly') === 'true';
  const isEdit = !!blockId;
  const orgUId = useOrgUId();
  const { organizationId } = useCurrentOrg();

  if (!orgUId || !organizationId) return null;

  return (
    <ClippySheet
      {...sheetProps}
      title={readOnly ? 'View block' : isEdit ? 'Edit block' : 'Create block'}
      description={
        readOnly
          ? 'This block is locked — used in a form with submissions.'
          : isEdit
            ? 'Edit this block and its fields.'
            : 'Create a new reusable block with fields.'
      }
      showSaveButton={false}
      showCancelButton={false}
    >
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <BlockForm
          blockId={blockId ?? undefined}
          orgUId={orgUId}
          organizationId={organizationId}
          readOnly={readOnly}
          onPendingChange={setIsPending}
          onCreated={(id) => sheetProps.open({ id })}
        />
      </Suspense>
    </ClippySheet>
  );
}
