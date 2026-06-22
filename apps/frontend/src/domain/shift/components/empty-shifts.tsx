import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';
import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { PropsWithChildren } from 'react';

export const EmptyShifts = async ({ children }: PropsWithChildren) => {
  const t = await getTranslations('Shift');

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>{t('empty.title')}</EmptyTitle>
        <EmptyDescription>{t('empty.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{children}</EmptyContent>
    </Empty>
  );
};
