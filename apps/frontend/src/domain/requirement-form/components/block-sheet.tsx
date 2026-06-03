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
  );
  const blockId = getParam('id');
  const isEdit = !!blockId;
  const orgUId = useOrgUId();
  const { organizationId } = useCurrentOrg();

  if (!orgUId || !organizationId) return null;

  return (
    <ClippySheet
      {...sheetProps}
      title={isEdit ? 'Edit block' : 'Create block'}
      description={
        isEdit
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
          onPendingChange={setIsPending}
          onCreated={(id) => sheetProps.open({ id })}
        />
      </Suspense>
    </ClippySheet>
  );
}
