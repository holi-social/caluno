import Link from 'next/link';
import { Button } from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function BackHeader({
  href = '/v1',
  eyebrow,
  title,
  subtitle,
  right,
  maxWidth = 'max-w-5xl',
}: {
  href?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  /** Tailwind max-width class for the inner container. */
  maxWidth?: string;
}) {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div
        className={`mx-auto flex ${maxWidth} items-center gap-4 px-6 py-4`}
      >
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link href={href}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          {eyebrow && (
            <p className="text-muted-foreground text-xs">{eyebrow}</p>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
