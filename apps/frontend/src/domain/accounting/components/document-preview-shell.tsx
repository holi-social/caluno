import { Badge, Separator } from '@repo/ui';
import type { ReactNode } from 'react';
import type { DocumentKind, PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';

interface SignatureLineProps {
  label: string;
  unsignedLabel: string;
}

function SignatureLine({ label, unsignedLabel }: SignatureLineProps) {
  return (
    <div>
      <div className="h-10 border-b" />
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{unsignedLabel}</p>
    </div>
  );
}

interface DocumentPreviewShellProps {
  kind: DocumentKind;
  pauschale: PauschalenType;
  pauschaleLabel: string;
  documentTitle: string;
  orgName: string;
  disclaimerLabel: string;
  signerLeftLabel: string;
  signerRightLabel: string;
  unsignedLabel: string;
  className?: string;
  children: ReactNode;
}

/**
 * Shared "paper" shell for the Contract/Invoice preview mocks: header,
 * disclaimer badge, and signature grid. Callers only supply the body rows
 * between the two separators.
 */
export function DocumentPreviewShell({
  kind,
  pauschale,
  pauschaleLabel,
  documentTitle,
  orgName,
  disclaimerLabel,
  signerLeftLabel,
  signerRightLabel,
  unsignedLabel,
  className,
  children,
}: DocumentPreviewShellProps) {
  return (
    <div className={className}>
      <div className="mx-auto max-w-[70ch] rounded-xl border bg-card p-8">
        <div className="flex items-start justify-between gap-4">
          <DocTypeHeader
            kind={kind}
            pauschale={pauschale}
            topLine={pauschaleLabel}
            name={documentTitle}
            subline={orgName}
          />
          <Badge variant="outline">{disclaimerLabel}</Badge>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4 text-base">{children}</div>

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-8">
          <SignatureLine
            label={signerLeftLabel}
            unsignedLabel={unsignedLabel}
          />
          <SignatureLine
            label={signerRightLabel}
            unsignedLabel={unsignedLabel}
          />
        </div>
      </div>
    </div>
  );
}
