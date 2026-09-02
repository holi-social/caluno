'use client';

import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  clearCheckInSuccessPayload,
  getCheckInSuccessPayload,
} from '../../check-in-success-dialog';

export function CheckInSuccessDialog() {
  const t = useTranslations('CheckIn');
  const payload = getCheckInSuccessPayload();
  const [isOpen, setIsOpen] = useState(true);

  const handleOpenChange = (value: boolean) => {
    if (value) return;
    clearCheckInSuccessPayload();
    setIsOpen(value);
  };

  if (!payload) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg pt-16">
        <DialogHeader className="items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-9 text-primary" strokeWidth={3} />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {t('successDialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-center max-w-sm">
            {t('successDialogBody', { volunteerName: payload.volunteerName })}
          </DialogDescription>
        </DialogHeader>

        {payload.shiftTitle && (
          <Card className="shadow-none bg-muted">
            <CardContent className="space-y-1">
              <p className="font-bold">{payload.shiftTitle}</p>
              {payload.timeRange && (
                <p className="text-sm text-muted-foreground">
                  {payload.timeRange}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Button type="button" onClick={() => handleOpenChange(false)}>
          {t('successDialogCloseButton')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
