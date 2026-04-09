'use client';

import { CirclePlay, CircleStop, Coffee } from 'lucide-react';
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
        'flex flex-col items-start justify-start gap-4 py-6 px-6 rounded-xl border shadow-sm transition-opacity w-full disabled:opacity-50 disabled:cursor-not-allowed text-left',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-secondary text-secondary-foreground border-border',
        className,
      )}
    >
      <span className="font-bold text-lg leading-none">{label}</span>
      <div className="size-10 flex items-center justify-center">{icon}</div>
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
          <h1 className="text-[24px] font-medium leading-8">Welcome to Hanseatic Help!</h1>
          <p className="text-[18px] text-foreground mt-4 mb-0">
            Are you just starting your day with us or planning to leave now?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* Starting + Finishing side by side */}
          <div className="grid grid-cols-2 gap-4">
            <ActionCard
              label="Starting"
              icon={<CirclePlay className="w-full h-full stroke-primary-foreground" />}
              onClick={() => onSelect('starting')}
              disabled={loading}
              variant="primary"
            />
            <ActionCard
              label="Finishing"
              icon={<CircleStop className="w-full h-full stroke-primary-foreground" />}
              onClick={() => onSelect('finishing')}
              disabled={loading}
              variant="primary"
            />
          </div>

          {/* Taking a break full width */}
          <Card className="w-full cursor-pointer hover:bg-secondary/80 transition-colors">
            <button
              type="button"
              onClick={() => onSelect('break')}
              disabled={loading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">Taking a break</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-4">
                <Coffee className="size-8 text-secondary-foreground" />
              </CardContent>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
