import { Badge } from '@repo/ui';
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
        <Badge key={item.key} variant="outline">
          {item.value}
        </Badge>
      ))}
    </div>
  );
}
