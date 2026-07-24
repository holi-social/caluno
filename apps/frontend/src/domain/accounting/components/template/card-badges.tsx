import { useTranslations } from 'next-intl';
import type { TemplateCardSummary } from './types';

interface TemplateCardBadgesProps {
  summary: TemplateCardSummary;
}

export function TemplateCardBadges({ summary }: TemplateCardBadgesProps) {
  const tFormat = useTranslations(
    'Accounting.templates.builder.invoiceNumberFormats',
  );

  const items: { key: string; value: string }[] =
    'task' in summary
      ? [
          { key: 'task', value: summary.task },
          {
            key: 'hourlyRate',
            value: `${summary.hourlyRate} €/Std.`,
          },
        ]
      : [
          ...(summary.kostenstelle
            ? [
                {
                  key: 'kostenstelle',
                  value: summary.kostenstelle,
                },
              ]
            : []),
          {
            key: 'invoiceNumberFormat',
            value: tFormat(summary.invoiceNumberFormat),
          },
        ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex w-fit items-center gap-1 rounded-md border border-border px-2 py-0.5 text-sm text-foreground"
        >
          {item.value}
        </span>
      ))}
    </div>
  );
}
