'use client';

import { ChevronLeftIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Cobranding } from './cobranding';

export type DetailPageHeaderVariant = 'full' | 'no-actions' | 'landing';

export interface DetailPageHeaderProps {
  /** Page title — shown in `full` and `no-actions` variants; omitted in `landing`. */
  title?: string;
  /** Which header layout to render. Consumer decides; component does not infer. */
  variant?: DetailPageHeaderVariant;
  /** Frosted-glass treatment. Floats above hero images. */
  transparent?: boolean;
  /** `OrganizationUnit.logoUrl`. Hides the entire Cobranding lockup when absent. */
  logoUrl?: string | null;
  /** Navigates to the previous screen. */
  onBack: () => void;
  /** Accessible label for the icon-only back button. */
  backLabel?: string;
  /** Platform logo rendered inside the Cobranding lockup. Falls back to the geometric placeholder. */
  ourLogo?: React.ReactNode;
  /**
   * Contextual actions injected by the consuming page (e.g. share icon, edit
   * button). Only rendered in the `full` variant. The header is agnostic to
   * content — wrap each icon in a ≥44×44px touch target.
   */
  actions?: React.ReactNode;
  className?: string;
}

export function DetailPageHeader({
  title,
  variant = 'full',
  transparent = false,
  logoUrl,
  onBack,
  backLabel = 'Zurück',
  ourLogo,
  actions,
  className,
}: DetailPageHeaderProps) {
  const showTitle = variant !== 'landing';
  const showActions = variant === 'full';

  return (
    <header
      className={cn(
        'flex w-full items-center',
        transparent
          ? 'border-b border-border bg-muted/70 backdrop-blur-sm'
          : 'bg-muted',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 md:px-20">
        {/* Left lockup: back button + optional page title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg',
              'text-foreground transition-colors',
              'hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
            )}
          >
            <ChevronLeftIcon className="size-6" />
          </button>

          {showTitle && title && (
            <span className="truncate text-base font-bold leading-none text-foreground">
              {title}
            </span>
          )}
        </div>

        {/* Right side: cobranding + actions */}
        <div className="flex shrink-0 items-center gap-3">
          <Cobranding logoUrl={logoUrl} ourLogo={ourLogo} size="small" />

          {showActions && actions && (
            <div className="flex items-center">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
