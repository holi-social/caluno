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
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { wait } from '@/lib/wait';

type Props = React.PropsWithChildren & {
  title: string;
  description?: string;
  formError?: string;
  onSubmit: () => void;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
};

export const useFormSheet = (openedByNavigation = true) => {
  const router = useRouter();
  const [open, setOpenState] = useState(true);

  const setOpen = async (opening: boolean) => {
    setOpenState(opening);
    if (!opening && openedByNavigation) {
      // wait a moment to allow the sheet animation to slide closed, before going back.
      await wait(500);
      router.back();
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
  children,
}: Props) => {
  const isMobile = useIsMobile();
  const t = useTranslations('Common');

  return (
    <Sheet open={open} onOpenChange={() => onOpenChange(!open)} defaultOpen>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'w-full md:max-w-xl h-full',
          isMobile && 'max-h-[calc(100vh-1.5rem)] rounded-t-2xl',
        )}
      >
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div className="overflow-y-auto space-y-6 px-6 pb-6 pt-5 mask-linear-gradient(to_bottom,transparent_0,black_2rem,black_calc(100%-2rem),transparent_100%)]">
            {formError && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {formError}
              </div>
            )}

            {children}
          </div>

          <SheetFooter className="flex flex-row">
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
