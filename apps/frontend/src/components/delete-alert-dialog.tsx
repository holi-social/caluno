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
}

export function DeleteAlertDialog({
  title,
  description,
  onDelete,
  trigger,
  deleteLabel,
}: DeleteAlertDialogProps) {
  const t = useTranslations('Common');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
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
