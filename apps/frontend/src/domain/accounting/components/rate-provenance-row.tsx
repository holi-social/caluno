export type RateProvenance = 'inherited' | 'override' | 'unset';

interface RateProvenanceRowProps {
  /** Preformatted rate, e.g. "4,50 €". */
  rate?: string;
  unit?: string;
  inheritedLabel: string;
  className?: string;
}

export function RateProvenanceRow({
  rate,
  unit = '',
  inheritedLabel,
  className,
}: RateProvenanceRowProps) {
  if (rate === undefined) return null;

  return (
    <p className={className ?? 'text-sm text-muted-foreground'}>
      {inheritedLabel}: {rate}
      {unit}
    </p>
  );
}
