'use client';

import {
  Button,
  cn,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  useIsMobile,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { wait } from '@/lib/wait';

type Props = React.PropsWithChildren & {
  title: string;
  description?: string;
  formError?: string;
  onSubmit: () => void;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  /** Stretch body to fill space between header and footer (for flex-growing content like transfer lists). */
  fillContent?: boolean;
};

export const useFormSheet = (openedByNavigation = true) => {
  const router = useRouter();
  const pathname = usePathname();
  const sheetPath = useRef(pathname);
  const [open, setOpenState] = useState(true);

  // HACK: If you close the sheet, soft-navigate away and then soft-navigate back you will arrive at the correct url
  // but the sheet will still be closed from previously closing it. This forces it open again, on returning.
  useEffect(() => {
    if (pathname === sheetPath.current) {
      setOpenState(true);
    }
  }, [pathname]);

  const setOpen = async (opening: boolean, onClose?: () => void) => {
    setOpenState(opening);

    if (!opening) {
      // wait a moment to allow the sheet animation to slide closed, before going back.
      await wait(500);

      if (onClose) {
        onClose();
        return;
      }

      if (openedByNavigation) {
        router.back();
        return;
      }
    }
  };

  return { open, setOpen };
};

export const FormSheet = ({
  title,
  description,
  formError,
  onSubmit,
  open = true,
  onOpenChange,
  pending = false,
  fillContent = false,
  children,
}: Props) => {
  const isMobile = useIsMobile();
  const t = useTranslations('Common');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex h-full w-full flex-col gap-0 overflow-hidden md:max-w-xl',
          isMobile && 'max-h-[calc(100vh-1.5rem)] rounded-t-2xl',
        )}
      >
        <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 px-6 pt-6">
            <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div
            className={cn(
              'px-6 pb-6 pt-5',
              fillContent
                ? 'flex min-h-0 flex-1 flex-col overflow-y-auto mask-linear-gradient(to_bottom,transparent_0,black_2rem,black_calc(100%-2rem),transparent_100%)]'
                : 'space-y-6 overflow-y-auto mask-linear-gradient(to_bottom,transparent_0,black_2rem,black_calc(100%-2rem),transparent_100%)]',
            )}
          >
            {formError && (
              <div className="shrink-0 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {formError}
              </div>
            )}

            {children}
          </div>

          <SheetFooter className="flex shrink-0 flex-row">
            <SheetClose asChild>
              <Button variant="secondary" className="flex-1" disabled={pending}>
                {t('cancel')}
              </Button>
            </SheetClose>

            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? t('saving') : t('saveChanges')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
