import type { PaginationInfo } from '@repo/data';
import { Button } from '@repo/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

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
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startItem = pagination.offset + 1;
  const endItem = Math.min(
    pagination.offset + pagination.limit,
    pagination.total,
  );

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {pagination.total} {name}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <PaginationButton
            href={`${url}?page=${currentPage - 1}`}
            canPage={currentPage > 1}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </PaginationButton>
          <PaginationButton
            href={`${url}?page=${currentPage + 1}`}
            canPage={pagination.hasMore}
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
};
