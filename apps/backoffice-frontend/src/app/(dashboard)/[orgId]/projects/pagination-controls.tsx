'use client';

import { Button } from '@repo/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface PaginationControlsProps {
  pagination: PaginationInfo;
  currentPage: number;
}

export function PaginationControls({
  pagination,
  currentPage,
}: PaginationControlsProps) {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startItem = pagination.offset + 1;
  const endItem = Math.min(
    pagination.offset + pagination.limit,
    pagination.total,
  );

  const handlePageChange = (newPage: number) => {
    router.push(`/${orgId}/projects?page=${newPage}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {pagination.total} projects
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || !pagination.hasMore}
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
