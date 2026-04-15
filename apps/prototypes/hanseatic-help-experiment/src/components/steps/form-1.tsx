'use client';

import { CirclePlay, CircleStop, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '@repo/ui';
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
  variant: 'primary' | 'secondary';
  className?: string;
}

function ActionCard({ label, icon, onClick, disabled, variant, className }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-stretch justify-start gap-4 py-6 px-6 rounded-xl border shadow-sm transition-opacity w-full h-full disabled:opacity-50 disabled:cursor-not-allowed text-left',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-secondary text-secondary-foreground border-border',
        className,
      )}
    >
      <span className="font-bold text-lg leading-none">{label}</span>
      <div className="w-full h-[60px] mt-auto flex items-center justify-end">{icon}</div>
    </button>
  );
}

export function Form1({ onSelect, loading }: Form1Props) {
  return (
    <div className="relative w-full flex flex-col gap-8 items-center pt-6 pb-4 px-4 min-h-full">
      <StepProgress value={STEP_PROGRESS['form-1']} />

      <Logo />

      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-[24px] font-medium leading-8">Gemeinsam beweisen wir noch mehr Wirkung!</h1>
          <p className="text-[18px] text-foreground mt-4 mb-0">
          Fängst Du gerade mit dem Freiwilligendienst an oder bist Du bereits fertig?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* Starting + Finishing side by side */}
          <div className="grid grid-cols-2 gap-4">
            <ActionCard
              label="Ich fange an"
              icon={<CirclePlay className="size-[60px] stroke-primary-foreground" />}
              onClick={() => onSelect('starting')}
              disabled={loading}
              variant="primary"
            />
            <ActionCard
              label="Ich bin fertig"
              icon={<CircleStop className="size-[60px] stroke-primary-foreground" />}
              onClick={() => onSelect('finishing')}
              disabled={loading}
              variant="primary"
            />
          </div>

          {/* Taking a break full width */}
          <Card className="w-full flex flex-row gap-6 py-6 cursor-pointer hover:bg-secondary/80 transition-colors">
            <button
              type="button"
              onClick={() => onSelect('break')}
              disabled={loading}
              className="w-full flex justify-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CardHeader className="w-full flex flex-row items-center justify-center h-fit">
                <div className="p-0 shrink-0 flex items-center justify-center w-fit h-fit">
                  <Pencil className="size-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-lg font-bold w-fit">Start- & Endzeit manuell eintragen</CardTitle>
              </CardHeader>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
