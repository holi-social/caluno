'use client';

import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { Check, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { UserCard } from '@/components/user-card';
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center gap-6">
          <div className="flex size-36 items-center justify-center rounded-full bg-success mt-8">
            <Check
              className="size-24 text-success-foreground"
              strokeWidth={3}
            />
          </div>

          <DialogTitle className="text-2xl font-bold">
            {t('successDialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-6">
          <UserCard
            user={{
              name: payload.volunteerName,
              image: payload.volunteerImage,
            }}
            size="lg"
            hideEmail
          />

          {payload.shiftTitle && (
            <Card className="shadow-none bg-muted">
              <CardContent className="space-y-1">
                <p className="font-bold">{payload.shiftTitle}</p>
                {payload.timeRange && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="size-4 shrink-0" />
                    {payload.timeRange}
                    {payload.dateLabel && `, ${payload.dateLabel}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="button" onClick={() => handleOpenChange(false)}>
            {t('successDialogCloseButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
