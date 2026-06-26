import type { PaginationInfo } from '@repo/data';
import { Button } from '@repo/ui';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { Link } from '@/i18n/navigation';

type PaginationControlsProps = {
  pagination: PaginationInfo;
  url: string;
  currentPage: number;
  name: string;
};

type PaginationButton = React.PropsWithChildren & {
  href: string;
  canPage: boolean;
};

const PaginationButton = ({ canPage, href, children }: PaginationButton) => {
  if (canPage) {
    return (
      <Link href={href}>
        <Button variant="outline" size="sm">
          {children}
        </Button>
      </Link>
    );
  } else {
    return (
      <Button variant="outline" size="sm" disabled>
        {children}
      </Button>
    );
  }
};

export const Pagination = ({
  pagination,
  url,
  currentPage,
  name,
}: PaginationControlsProps) => {
  const t = useTranslations('Pagination');
  const tCommon = useTranslations('Common');
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startItem = pagination.offset + 1;
  const endItem = Math.min(
    pagination.offset + pagination.limit,
    pagination.total,
  );

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {t('showing', {
          start: startItem,
          end: endItem,
          total: pagination.total,
          name,
        })}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {t('pageOf', { current: currentPage, total: totalPages })}
        </div>
        <div className="flex items-center gap-2">
          <PaginationButton
            href={`${url}?page=${currentPage - 1}`}
            canPage={currentPage > 1}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            {tCommon('previous')}
          </PaginationButton>
          <PaginationButton
            href={`${url}?page=${currentPage + 1}`}
            canPage={pagination.hasMore}
          >
            {tCommon('next')}
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
};
