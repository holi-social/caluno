'use client';

import {
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';

export type LimitBarState = 'normal' | 'warn' | 'at-cap';

function deriveState(pct: number): LimitBarState {
  if (pct >= 1) return 'at-cap';
  if (pct >= 0.8) return 'warn';
  return 'normal';
}

const FILL_CLASS: Record<LimitBarState, string> = {
  normal: 'bg-success',
  warn: 'bg-alert',
  'at-cap': 'bg-destructive',
};

const TEXT_CLASS: Record<LimitBarState, string> = {
  normal: 'text-success',
  warn: 'text-alert',
  'at-cap': 'text-destructive',
};

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildLabel(used: number, total: number, state: LimitBarState): string {
  const remaining = total - used;
  const suffix =
    state === 'at-cap' ? 'Limit erreicht' : `${formatEuro(remaining)} übrig`;
  return `${formatEuro(used)} von ${formatEuro(total)} · ${suffix}`;
}

interface LimitHeadroomBarProps {
  /** Euros consumed against the yearly cap. */
  used: number;
  /** Yearly Pauschalen cap in euros. */
  total: number;
  /** `inline` — bar only with tooltip; `block` — bar + label row; `text` — colored "used / total" with tooltip. */
  density?: 'inline' | 'block' | 'text';
  className?: string;
}

export function LimitHeadroomBar({
  used,
  total,
  density = 'inline',
  className,
}: LimitHeadroomBarProps) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const state = deriveState(pct);
  const label = buildLabel(used, total, state);

  const track = (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn('h-full rounded-full', FILL_CLASS[state])}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );

  if (density === 'text') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'text-sm tabular-nums font-medium cursor-default',
              TEXT_CLASS[state],
              className,
            )}
          >
            {formatEuro(used)} / {formatEuro(total)}
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  if (density === 'inline') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('w-full cursor-default', className)}>{track}</div>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {track}
      <p className={cn('text-sm tabular-nums', TEXT_CLASS[state])}>{label}</p>
    </div>
  );
}

export function LimitHeadroomBarSkeleton({
  density = 'inline',
  className,
}: Pick<LimitHeadroomBarProps, 'density' | 'className'>) {
  if (density === 'inline') {
    return <Skeleton className={cn('h-1.5 w-full rounded-full', className)} />;
  }
  return (
    <div className={cn('space-y-1', className)}>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="h-5 w-44" />
    </div>
  );
}
