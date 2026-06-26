'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const CreateTimeEntryButton = ({ orgUId }: { orgUId: string }) => {
  const t = useTranslations('TimeEntry');

  return (
    <Link href={`/admin/${orgUId}/timesheets/new`}>
      <Button>
        <PlusIcon /> {t('page.createButton')}
      </Button>
    </Link>
  );
};
