'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  RadioGroup,
  RadioGroupItem,
} from '@repo/ui';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { deleteShiftInstance } from '../actions';
import { shiftsListPath } from '../routes';

type DeleteChoice = 'only-this' | 'future';

interface DeleteShiftInstanceDialogProps {
  orgUId: string;
  instanceId: string;
  isRecurring: boolean;
  instanceDate: Date;
  trigger: ReactNode;
}

export function DeleteShiftInstanceDialog({
  orgUId,
  instanceId,
  isRecurring,
  instanceDate,
  trigger,
}: DeleteShiftInstanceDialogProps) {
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<DeleteChoice>('only-this');
  const { formatDate } = useFormatting();

  const instanceDateFormatted = formatDate(instanceDate);
  const isInstanceInThePast = (instanceDate ?? 0) < new Date();

  const runDelete = (applyToAllFuture: boolean) => {
    startDeleteTransition(async () => {
      const result = await deleteShiftInstance({
        instanceId,
        organizationUnitId: orgUId,
        applyToAllFuture,
      });
      if (result?.serverError) {
        toast.error(
          t('instanceDetail.deleteDialog.error', {
            error: result.serverError,
          }),
        );
        return;
      }
      toast.success(t('instanceDetail.deleteDialog.success'));
      setOpen(false);
      router.push(shiftsListPath(orgUId));
    });
  };

  if (!isRecurring) {
    return (
      <DeleteAlertDialog
        title={t('instanceDetail.deleteDialog.title')}
        description={t('instanceDetail.deleteDialog.oneTimeDescription', {
          date: instanceDateFormatted,
        })}
        onDelete={() => runDelete(false)}
        trigger={trigger}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={isInstanceInThePast}>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('instanceDetail.deleteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('instanceDetail.deleteDialog.description', {
              date: instanceDateFormatted,
            })}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={choice}
          onValueChange={(value) => setChoice(value as DeleteChoice)}
          className="gap-2"
        >
          <label
            htmlFor="only-this"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-muted"
          >
            <RadioGroupItem
              id="only-this"
              value="only-this"
              className="mt-0.5"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">
                {t('instanceDetail.deleteDialog.onlyThisTitle')}
              </span>
              <span className="text-muted-foreground text-xs">
                {t('instanceDetail.deleteDialog.onlyThisDescription', {
                  date: instanceDateFormatted,
                })}
              </span>
            </span>
          </label>

          <label
            htmlFor="future"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-muted"
          >
            <RadioGroupItem id="future" value="future" className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">
                {t('instanceDetail.deleteDialog.futureTitle')}
              </span>
              <span className="text-muted-foreground text-xs">
                {t('instanceDetail.deleteDialog.futureDescription')}
              </span>
            </span>
          </label>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => runDelete(choice === 'future')}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : null}
            {tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
