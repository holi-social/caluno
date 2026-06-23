import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const EmptyMyTime = () => {
  const t = useTranslations('MyTime');
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>{t('empty.title')}</EmptyTitle>
        <EmptyDescription>{t('empty.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/">{t('empty.cta')}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
};
