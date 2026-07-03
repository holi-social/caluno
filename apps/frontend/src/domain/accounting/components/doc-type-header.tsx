import { cn } from '@repo/ui';
import {
  CoinsIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileUserIcon,
} from 'lucide-react';

export type DocumentKind = 'contract' | 'invoice' | 'custom' | 'payment';
export type PauschalenType = 'ep' | 'ul';

// Intentional brand literals — legal type differentiation, exempt from token rule (SF-0 spec)
const TYPE_COLOR: Record<PauschalenType, string> = {
  ep: '#17857c',
  ul: '#7f22fe',
};

const KIND_ICON: Record<DocumentKind, React.ElementType> = {
  contract: FileUserIcon,
  invoice: FileSpreadsheetIcon,
  custom: FileIcon,
  payment: CoinsIcon,
};

interface DocTypeHeaderProps {
  kind: DocumentKind;
  pauschale: PauschalenType;
  topLine: string;
  name: string;
  subline?: string;
  className?: string;
}

export function DocTypeHeader({
  kind,
  pauschale,
  topLine,
  name,
  subline,
  className,
}: DocTypeHeaderProps) {
  const Icon = KIND_ICON[kind];
  const color = TYPE_COLOR[pauschale];

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border"
        style={{
          color,
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
        }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground leading-none truncate">
          {topLine}
        </p>
        <p className="text-base font-bold text-card-foreground leading-snug truncate">
          {name}
        </p>
        {subline && (
          <p className="text-sm text-muted-foreground leading-tight truncate">
            {subline}
          </p>
        )}
      </div>
    </div>
  );
}
