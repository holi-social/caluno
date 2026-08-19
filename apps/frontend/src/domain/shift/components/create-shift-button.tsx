'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { shiftNewPath } from '../routes';

interface CreateShiftButtonProps {
  orgUId: string;
  /** Override create href (e.g. event-scoped shift create). */
  href?: string;
  label?: string;
}

export function CreateShiftButton({
  orgUId,
  href,
  label,
}: CreateShiftButtonProps) {
  const t = useTranslations('Shift');

  return (
    <Link href={href ?? shiftNewPath(orgUId)}>
      <Button>
        <PlusIcon />
        {label ?? t('page.createButton')}
      </Button>
    </Link>
  );
}
