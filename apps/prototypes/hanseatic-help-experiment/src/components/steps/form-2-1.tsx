'use client';

import { RadioGroup, RadioGroupItem, Label, cn } from '@repo/ui';
import { Logo } from '@/components/logo';
import { StepProgress } from '@/components/step-progress';
import { STEP_PROGRESS } from '@/lib/types';

interface Form21Props {
  onSelect: (hours: number) => void;
  loading: boolean;
}

function getEndTime(hoursFromNow: number): string {
  const now = new Date();
  now.setHours(now.getHours() + hoursFromNow);
  return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

export function Form21({ onSelect, loading }: Form21Props) {
  return (
    <div className="relative flex flex-col gap-4 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-2-1']} />

      <Logo />

      <h1 className="text-2xl font-medium leading-8 w-full">
        How long are you planning to stay today?
      </h1>

      <RadioGroup
        className="w-full gap-1"
        onValueChange={(value) => {
          if (!loading) onSelect(Number(value));
        }}
      >
        {DURATION_OPTIONS.map((hours) => (
          <Label
            key={hours}
            htmlFor={`duration-${hours}`}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border bg-card cursor-pointer',
              'hover:bg-accent transition-colors w-full font-normal',
              loading && 'pointer-events-none opacity-50',
            )}
          >
            <RadioGroupItem
              id={`duration-${hours}`}
              value={String(hours)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="text-base font-medium leading-none">
                {hours} {hours === 1 ? 'hour' : 'hours'}
              </span>
              <span className="text-sm text-muted-foreground">
                Till around {getEndTime(hours)}
              </span>
            </div>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
