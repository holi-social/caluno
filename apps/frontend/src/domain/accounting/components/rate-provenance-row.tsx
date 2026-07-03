export type RateProvenance = 'inherited' | 'override' | 'unset';

interface RateProvenanceRowProps {
  rate?: number;
  unit?: string;
  inheritedLabel: string;
  className?: string;
}

export function RateProvenanceRow({
  rate,
  unit = '€/hr',
  inheritedLabel,
  className,
}: RateProvenanceRowProps) {
  if (rate === undefined) return null;

  return (
    <p className={className ?? 'text-sm text-muted-foreground'}>
      {inheritedLabel}: {rate.toFixed(2)} {unit}
    </p>
  );
}
