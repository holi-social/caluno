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
  SheetTrigger,
  useIsMobile,
} from '@repo/ui';

interface Props extends React.PropsWithChildren {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  title: string;
  trigger?: React.ReactNode;
  description?: string;
  showSaveButton?: boolean;
  showCancelButton?: boolean;
  isPending?: boolean;
  formId?: string;
}

export function ClippySheet({
  open,
  close,
  isOpen,
  title,
  description,
  trigger,
  showSaveButton = true,
  showCancelButton = true,
  isPending = false,
  formId,
  children,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={isOpen} onOpenChange={(isOpen) => (isOpen ? open() : close())}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col w-full md:max-w-xl gap-0',
          isMobile && 'h-full max-h-[calc(100vh-1.5rem)] rounded-t-2xl',
        )}
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>

          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="overflow-y-auto px-6 py-6 [mask-image:linear-gradient(to_bottom,transparent_0,black_2rem,black_calc(100%_-_2rem),transparent_100%)]">
          {children}
        </div>

        <SheetFooter className="flex flex-row">
          {showCancelButton && (
            <SheetClose asChild>
              <Button variant="outline" className="flex-1" disabled={isPending}>
                Cancel
              </Button>
            </SheetClose>
          )}

          {showSaveButton && (
            <Button
              type="submit"
              form={formId}
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
