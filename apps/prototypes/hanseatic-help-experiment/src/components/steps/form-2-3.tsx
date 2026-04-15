'use client';

import { useState } from 'react';
import { Clock2 } from 'lucide-react';
import { Button, Card, CardContent, Input, Label } from '@repo/ui';
import { Logo } from '@/components/logo';
import { StepProgress } from '@/components/step-progress';
import { STEP_PROGRESS } from '@/lib/types';

interface Form23Props {
  onContinue: (arrivalTime: string, departureTime: string) => void;
  loading: boolean;
}

function getNowTime(): string {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function Form23({ onContinue, loading }: Form23Props) {
  const [arrivalTime, setArrivalTime] = useState(getNowTime());
  const [departureTime, setDepartureTime] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (arrivalTime && departureTime) onContinue(arrivalTime, departureTime);
  }

  return (
    <div className="relative flex flex-col gap-4 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-2-3']} />

      <Logo />

      <h1 className="text-[24px] font-medium leading-8 w-full">
      Sag uns, wie lange du heute ungefähr helfen möchtest
      </h1>

      <Card className="w-full">
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-end">
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="break-arrival-time" className="text-base font-medium">
                Wann hast du angefangen?
                </Label>
                <div className="relative">
                  <Clock2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="break-arrival-time"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="departure-time" className="text-base font-medium">
                Wann planst du aufzuhören?
                </Label>
                <div className="relative">
                  <Clock2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="departure-time"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !arrivalTime || !departureTime}
            >
              Weiter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
