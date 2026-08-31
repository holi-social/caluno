import { cn } from '../lib/utils';
import LogoLettermarkMark from './logo-lettermark.svg';

export interface LogoLettermarkProps {
  /** Width in pixels; height scales automatically to preserve the mark's aspect ratio. */
  width?: number;
  className?: string;
}

export function LogoLettermark({ width = 32, className }: LogoLettermarkProps) {
  return (
    <LogoLettermarkMark
      width={width}
      className={cn('text-foreground', className)}
      role="img"
      aria-label="Caluno"
    />
  );
}
