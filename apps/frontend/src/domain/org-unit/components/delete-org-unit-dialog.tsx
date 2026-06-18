'use client';

import type { OrgUnitTreeNode } from '@repo/data';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from '@repo/ui';
import { useState, useTransition } from 'react';
import { deleteOrgUnit } from '@/domain/org-unit/actions';
import { useRouter } from '@/i18n/navigation';

interface DeleteOrgUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationUnitId: string;
  unit: OrgUnitTreeNode | null;
}

export function DeleteOrgUnitDialog({
  open,
  onOpenChange,
  organizationUnitId,
  unit,
}: DeleteOrgUnitDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const hasChildren = (unit?.children?.length ?? 0) > 0;
  const confirmed = confirmation === 'DELETE';

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmation('');
      setServerError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = () => {
    if (!unit || !confirmed) return;
    setServerError(null);

    startTransition(async () => {
      const result = await deleteOrgUnit({ id: unit.id, organizationUnitId });
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        handleClose(false);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{unit?.name}&quot;</AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. The unit will be permanently deleted.
            {hasChildren && (
              <span className="mt-2 block font-medium text-destructive">
                Warning: this unit has children. Deleting it will affect the
                hierarchy.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field className="space-y-1">
          <FieldLabel htmlFor="delete-confirm">
            Type <strong>DELETE</strong> to confirm
          </FieldLabel>

          <Input
            id="delete-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            disabled={isPending}
          />
        </Field>

        {serverError && <FieldError>{serverError}</FieldError>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !confirmed}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
