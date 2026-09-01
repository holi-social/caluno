'use client';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  useIsMobile,
} from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type CheckInSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode | undefined;
};

/**
 * Chrome shared by every check-in picker sheet. Lifted from
 * `manual-check-in-dialog.tsx` so the three pickers stay visually identical.
 */
export function CheckInSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: CheckInSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className={cn(
          'flex h-full w-full flex-col gap-0 p-0 md:max-w-md',
          isMobile && 'max-h-[calc(100vh-1.5rem)] rounded-t-2xl',
        )}
      >
        <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft />
          </Button>
          <SheetTitle className="flex-1 text-center text-lg">
            {title}
          </SheetTitle>
          <div className="size-9 shrink-0" />
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">{children}</div>

        {footer && <div className="border-t p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
