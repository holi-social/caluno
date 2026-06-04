'use client';

import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { Edit, Loader2, Trash } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
  const [isDeleting, startTransition] = useTransition();
  const buttonSize = `icon-${size}` as const;
  const editHref = `/admin/${organizationUnitId}/settings/roles/${id}/edit`;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRole({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(`Failed to delete Role. ${result.serverError}`);
      } else {
        toast.success('Role deleted');
        router.refresh();
        if (pathname === `/admin/${organizationUnitId}/settings/roles/${id}`) {
          router.push(`/admin/${organizationUnitId}/settings/roles`);
        }
      }
    });
  };

  return (
    <aside className="flex items-center gap-2">
      {!isInternal && (
        <RequirePermission permission={PermissionKey.OrgEdit}>
          <Button variant="outline" size={buttonSize} asChild>
            <Link href={editHref} aria-label="Edit role">
              <Edit />
            </Link>
          </Button>

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
