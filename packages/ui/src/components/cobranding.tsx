import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Logo } from './logo';

export interface CobrandingProps {
  logoUrl?: string | null;
  /** Slot for the platform logo. Falls back to a geometric placeholder. */
  ourLogo?: ReactNode;
  size?: 'small' | 'big';
  /** Optional click handler for the organisation logo area. */
  onClick?: () => void;
  className?: string;
}

export function Cobranding({
  logoUrl,
  ourLogo,
  size = 'small',
  onClick,
  className,
}: CobrandingProps) {
  if (!logoUrl) return null;

  const isBig = size === 'big';

  const content = (
    <>
      <img
        src={logoUrl}
        alt=""
        aria-hidden
        className={cn(
          'object-contain',
          isBig ? 'h-12 max-w-[200px]' : 'h-8 w-12',
        )}
      />
      <div className={cn('w-px bg-border', isBig ? 'h-6' : 'h-5')} />
      {ourLogo ?? <Logo width={isBig ? 42 : 38} className="opacity-40" />}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Organisation"
        className={cn(
          'flex items-center rounded-lg transition-colors',
          isBig ? 'gap-4' : 'gap-1',
          'min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
          'hover:bg-accent',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn('flex items-center', isBig ? 'gap-4' : 'gap-1', className)}
    >
      {content}
    </div>
  );
}
