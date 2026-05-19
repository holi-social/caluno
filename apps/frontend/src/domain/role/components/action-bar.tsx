'use client';

import type { RoleListItem } from '@repo/data';
import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { Edit, Loader2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { RequirePermission } from '@/components/require-permission';
import { deleteRole } from '../actions';

type ActionBarProps = {
  id: string;
  isInternal: boolean;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
};

export const ActionBar = ({
  organizationUnitId,
  id,
  isInternal,
  size = 'sm',
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startTransition] = useTransition();
  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRole({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(`Failed to delete Role. ${result.serverError}`);
      } else {
        toast.success('Role deleted');
        router.push(`/${organizationUnitId}/settings/roles`);
      }
    });
  };

  return (
    <aside className="space-x-2">
      <RequirePermission permission={PermissionKey.RoleUpdate}>
        <Link href={`/${organizationUnitId}/settings/roles/${id}/edit`}>
          <Button
            variant="outline"
            size={buttonSize}
            aria-label="Edit a roles permissions"
          >
            <Edit />
          </Button>
        </Link>
      </RequirePermission>
      {!isInternal && (
        <RequirePermission permission={PermissionKey.RoleDelete}>
          <DeleteAlertDialog
            title="Delete Role"
            description="Are you sure you wish to delete this Role?"
            onDelete={handleDelete}
            trigger={
              <Button
                size={buttonSize}
                variant="destructive"
                aria-label="Delete role"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
              </Button>
            }
          />
        </RequirePermission>
      )}
    </aside>
  );
};
