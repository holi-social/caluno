import { cn } from '../lib/utils';
import LogoMark from './logo.svg';

export interface LogoProps {
  /** Width in pixels; height scales automatically to preserve the logo's aspect ratio. */
  width?: number;
  className?: string;
}

export function Logo({ width = 120, className }: LogoProps) {
  return (
    <LogoMark
      width={width}
      className={cn('text-foreground', className)}
      role="img"
      aria-label="Caluno"
    />
  );
}
