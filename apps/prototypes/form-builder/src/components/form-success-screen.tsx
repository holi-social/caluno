'use client';

import { Button, Card, CardContent } from '@repo/ui';
import { CheckCircle } from 'lucide-react';
import type { FormSettings } from '@/lib/types';

export function FormSuccessScreen({
  settings,
  onReset,
}: {
  settings: FormSettings;
  onReset?: () => void;
}) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="space-y-4 pt-8 pb-8">
        <div className="text-primary mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="size-8" />
        </div>
        <h2 className="text-2xl font-bold">{settings.successTitle}</h2>
        <p className="text-muted-foreground">{settings.successMessage}</p>
        {onReset && (
          <Button variant="outline" onClick={onReset} className="mt-4">
            Neues Formular ausfüllen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
