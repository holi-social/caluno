'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { shiftNewPath } from '../routes';

interface CreateShiftButtonProps {
  orgUId: string;
}

export function CreateShiftButton({ orgUId }: CreateShiftButtonProps) {
  const t = useTranslations('Shift');

  return (
    <Link href={shiftNewPath(orgUId)}>
      <Button>
        <PlusIcon />
        {t('page.createButton')}
      </Button>
    </Link>
  );
}
