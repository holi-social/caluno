'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeleteAlertDialogProps {
  title: string;
  description: string;
  onDelete: () => void;
  trigger: React.ReactNode;
  deleteLabel?: string;
  /** When true the dialog trigger is disabled and cannot open the dialog. */
  disabled?: boolean;
}

export function DeleteAlertDialog({
  title,
  description,
  onDelete,
  trigger,
  deleteLabel,
  disabled,
}: DeleteAlertDialogProps) {
  const t = useTranslations('Common');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <X />
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} variant="destructive">
            <Trash2 />
            {deleteLabel || t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
