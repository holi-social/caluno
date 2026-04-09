'use client';

import { useState } from 'react';
import { Clock2 } from 'lucide-react';
import { Button, Card, CardContent, Input, Label } from '@repo/ui';
import { Logo } from '@/components/logo';
import { StepProgress } from '@/components/step-progress';
import { STEP_PROGRESS } from '@/lib/types';

interface Form22Props {
  onContinue: (arrivalTime: string) => void;
  loading: boolean;
}

function getNowTime(): string {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function Form22({ onContinue, loading }: Form22Props) {
  const [arrivalTime, setArrivalTime] = useState(getNowTime());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (arrivalTime) onContinue(arrivalTime);
  }

  return (
    <div className="relative flex flex-col gap-4 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-2-2']} />

      <Logo />

      <h1 className="text-[24px] font-medium leading-8 w-full">
      Wann hast du heute ungefähr angefangen?
      </h1>

      <Card className="w-full">
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-end">
            <div className="w-full flex flex-col gap-2">
              <Label htmlFor="arrival-time" className="text-base font-medium">
              Startzeit
              </Label>
              <div className="relative">
                <Clock2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="arrival-time"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" disabled={loading || !arrivalTime}>
              Weiter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
