'use client';

import type {
  OrganizationUnitType,
  OrgUnitNodeFieldsFragment,
} from '@repo/data';
import { useState } from 'react';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { DeleteOrgUnitDialog } from './delete-org-unit-dialog';
import {
  FORM_ID as CREATE_EDIT_FORM_ID,
  OrgUnitCreateEditSheet,
} from './org-unit-create-edit-sheet';
import { OrgUnitTree } from './org-unit-tree';

type OrgUnitNode = OrgUnitNodeFieldsFragment & {
  children?: OrgUnitNode[];
};

interface OrgUnitSetupClientProps {
  tree: OrgUnitNode | null;
  types: OrganizationUnitType[];
  organizationUnitId: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function OrgUnitSetup({
  tree,
  types,
  organizationUnitId,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: OrgUnitSetupClientProps) {
  const [orgUnitToDelete, setOrgUnitToDelete] = useState<OrgUnitNode | null>(
    null,
  );

  const { open: openOrgUnitSheet } = useSheetTrigger(CREATE_EDIT_FORM_ID);

  if (!tree) {
    return (
      <p className="text-muted-foreground">
        No org unit tree found. Contact your administrator.
      </p>
    );
  }

  return (
    <>
      <OrgUnitTree
        root={tree}
        onCreate={(parentNode) => openOrgUnitSheet({ parentId: parentNode.id })}
        onEdit={(node) => openOrgUnitSheet({ id: node.id })}
        onDelete={setOrgUnitToDelete}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
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
