'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function CreateEventButton({ orgUId }: { orgUId: string }) {
  const t = useTranslations('Event');

  return (
    <Link href={`/admin/${orgUId}/events/new`}>
      <Button>
        <PlusIcon />
        {t('list.createButton')}
      </Button>
    </Link>
  );
}
