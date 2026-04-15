'use client';

import { CirclePlay, CirclePlus, CircleStop } from 'lucide-react';
import { Card, cn } from '@repo/ui';
import { Logo } from '@/components/logo';
import { StepProgress } from '@/components/step-progress';
import { STEP_PROGRESS } from '@/lib/types';
import type { Action } from '@/lib/types';

interface Form1Props {
  onSelect: (action: Action) => void;
  loading: boolean;
}

interface ActionCardProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary' | 'green';
  className?: string;
}

function ActionCard({ label, icon, onClick, disabled, variant, className }: ActionCardProps) {
  return (
    <Card
      className={cn(
        'w-full',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground border-primary'
          : variant === 'green'
          ? 'bg-green-700 text-white border-green-700'
          : '',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full flex flex-row items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <span className="font-bold text-lg">{label}</span>
        {icon}
      </button>
    </Card>
  );
}

export function Form1({ onSelect, loading }: Form1Props) {
  return (
    <div className="relative w-full flex flex-col gap-8 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-1']} />

      <Logo />

      <div className="flex flex-col gap-6 w-full max-w-[540px]">
        <div>
          <h1 className="text-[24px] font-medium leading-8">Gemeinsam beweisen wir noch mehr Wirkung!</h1>
          <p className="text-[18px] text-foreground mt-4 mb-0">
          Fängst Du gerade mit dem Freiwilligendienst an oder bist Du bereits fertig?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* Starting + Finishing stacked full width */}
          <ActionCard
            label="Ich fange an"
            icon={<CirclePlay aria-hidden="true" className="size-12 stroke-primary-foreground shrink-0" />}
            onClick={() => onSelect('starting')}
            disabled={loading}
            variant="primary"
          />
          <ActionCard
            label="Ich bin fertig"
            icon={<CircleStop aria-hidden="true" className="size-12 stroke-white shrink-0" />}
            onClick={() => onSelect('finishing')}
            disabled={loading}
            variant="green"
          />

          {/* Taking a break full width */}
          <ActionCard
            label="Start- & Endzeit manuell eintragen"
            icon={<CirclePlus aria-hidden="true" className="size-12 shrink-0" />}
            onClick={() => onSelect('break')}
            disabled={loading}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
}
