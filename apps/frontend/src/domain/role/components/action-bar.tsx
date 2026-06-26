'use client';

import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { Edit, Loader2, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { RequirePermission } from '@/components/require-permission';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
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
  const t = useTranslations('Role.action');

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRole({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(t('deleteError', { error: result.serverError }));
      } else {
        toast.success(t('deleteSuccess'));
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
            <Link href={editHref} aria-label={t('editAria')}>
              <Edit />
            </Link>
          </Button>

          <DeleteAlertDialog
            title={t('deleteTitle')}
            description={t('deleteDescription')}
            onDelete={handleDelete}
            trigger={
              <Button
                size={buttonSize}
                variant="destructive"
                aria-label={t('deleteAria')}
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
