import { cn } from '../lib/utils';

export interface LogoProps {
  /** Kept for API compatibility; the wordmark size is fixed. */
  width?: number;
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        'font-bold tracking-tight text-[#00C950] dark:text-[#BBF451]',
        className,
      )}
    >
      Caluno
    </span>
  );
}
