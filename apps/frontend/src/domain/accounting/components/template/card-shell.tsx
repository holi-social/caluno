import { cn } from '@repo/ui';
import type { ReactNode } from 'react';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { DocTypeHeader } from '../doc-type-header';

interface TemplateCardShellProps {
  pauschale: PauschalenType;
  kind: DocumentKind;
  topLine: string;
  name: string;
  contentClassName?: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared shell behind the configured and unconfigured template cards — same border/header/footer structure, different body content. */
export function TemplateCardShell({
  pauschale,
  kind,
  topLine,
  name,
  contentClassName = 'space-y-3',
  children,
  footer,
}: TemplateCardShellProps) {
  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      <div className={cn('p-4', contentClassName)}>
        <DocTypeHeader
          kind={kind}
          pauschale={pauschale}
          topLine={topLine}
          name={name}
        />
        {children}
      </div>

      <div className="mt-auto border-t p-3">{footer}</div>
    </div>
  );
}
