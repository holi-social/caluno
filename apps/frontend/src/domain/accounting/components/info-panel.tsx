import { cn } from '@repo/ui';
import type { ReactNode } from 'react';

interface InfoPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  /** 'muted' (default): the original filled box from the creation modals. 'outline': bordered card, matching the template builder's editor cards. */
  variant?: 'muted' | 'outline';
  /** Rendered at the right of the header row — e.g. a toggle `Switch`, or a lock icon + tooltip for a mandatory field. */
  headerRight?: ReactNode;
  /** Rendered next to the title — e.g. an amber "Missing data" pill. */
  badge?: ReactNode;
  /** Dims the title to read as switched off; callers still decide whether `children` renders at all. */
  inactive?: boolean;
  /** Override the title's default variant-based size/weight — e.g. a larger heading for a block-level card versus a field-level one. */
  titleClassName?: string;
}

/** Titled box for supporting-info cards (creation modals) and, as `variant="outline"`, the template builder's editor cards. */
export function InfoPanel({
  title,
  children,
  className,
  variant = 'muted',
  headerRight,
  badge,
  inactive = false,
  titleClassName,
}: InfoPanelProps) {
  return (
    <div
      className={cn(
        'p-4',
        variant === 'muted'
          ? 'rounded-xl bg-muted'
          : 'flex flex-col gap-2 rounded-lg border bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              titleClassName ??
                (variant === 'muted'
                  ? 'text-sm font-semibold'
                  : 'text-base font-semibold text-foreground'),
              inactive && 'text-muted-foreground',
            )}
          >
            {title}
          </p>
          {badge}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}
