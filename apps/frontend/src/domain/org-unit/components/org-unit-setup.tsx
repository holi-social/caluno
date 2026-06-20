'use client';

import type { OrganizationUnitType, OrgUnitTreeNode } from '@repo/data';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { DeleteOrgUnitDialog } from './delete-org-unit-dialog';
import {
  FORM_ID as CREATE_EDIT_FORM_ID,
  OrgUnitCreateEditSheet,
} from './org-unit-create-edit-sheet';
import { OrgUnitTree } from './org-unit-tree';

interface OrgUnitSetupClientProps {
  tree: OrgUnitTreeNode | null;
  types: OrganizationUnitType[];
  organizationUnitId: string;
  canEdit?: boolean;
}

export function OrgUnitSetup({
  tree,
  types,
  organizationUnitId,
  canEdit = false,
}: OrgUnitSetupClientProps) {
  const [orgUnitToDelete, setOrgUnitToDelete] =
    useState<OrgUnitTreeNode | null>(null);

  const { open: openOrgUnitSheet } = useSheetTrigger(CREATE_EDIT_FORM_ID);
  const t = useTranslations('OrgUnit.tree');

  if (!tree) {
    return <p className="text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <>
      <OrgUnitTree
        root={tree}
        onCreate={(parentNode) => openOrgUnitSheet({ parentId: parentNode.id })}
        onEdit={(node) => openOrgUnitSheet({ id: node.id })}
        onDelete={setOrgUnitToDelete}
        canEdit={canEdit}
      />

      <OrgUnitCreateEditSheet types={types} />

      <DeleteOrgUnitDialog
        open={orgUnitToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setOrgUnitToDelete(null);
        }}
        organizationUnitId={organizationUnitId}
        unit={orgUnitToDelete}
      />
    </>
  );
}
