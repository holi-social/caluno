import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Logo } from './logo';

export interface CobrandingProps {
  logoUrl?: string | null;
  /** Slot for the platform logo. Falls back to a geometric placeholder. */
  ourLogo?: ReactNode;
  size?: 'small' | 'big';
  className?: string;
}

export function Cobranding({
  logoUrl,
  ourLogo,
  size = 'small',
  className,
}: CobrandingProps) {
  if (!logoUrl) return null;

  if (size === 'big') {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <img
        src={logoUrl}
        alt=""
        aria-hidden
        className="h-8 w-12 object-contain"
      />
      <div className="h-5 w-px bg-border" />
      {ourLogo ?? <Logo width={38} className="opacity-40" />}
    </div>
  );
}
