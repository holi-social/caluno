import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Button } from './base/button';
import { Logo } from './logo';

export interface CobrandingProps {
  /** URL of the organization logo. */
  logoUrl?: string | null;
  /** Slot for the platform logo. Falls back to a geometric placeholder. */
  ourLogo?: ReactNode;
  organizationName?: string;
  size?: 'small' | 'big';
  onClick?: () => void;
  className?: string;
}

export function Cobranding({
  logoUrl,
  ourLogo,
  organizationName,
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
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        aria-label={
          organizationName ? `Go to ${organizationName}` : 'Go to organization'
        }
        className={cn(
          'h-auto rounded-lg p-0',
          isBig ? 'gap-4' : 'gap-1',
          className,
        )}
      >
        {content}
      </Button>
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
