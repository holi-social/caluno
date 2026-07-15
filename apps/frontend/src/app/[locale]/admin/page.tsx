import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';

import { Building2, HandHeart } from 'lucide-react';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { resolveAdminDestination } from '@/lib/routing';

export default async function Home() {
  const destination = await resolveAdminDestination();
  const t = await getTranslations('Organization.home');

  if (destination) {
    redirect(destination);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-16">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2 />
          </EmptyMedia>
          <EmptyTitle>{t('title')}</EmptyTitle>
          <EmptyDescription>{t('description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">
              <HandHeart />
              {t('toVolunteering')}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
