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

  const task = 'task' in summary ? summary.task : undefined;

  const badgeItems: { key: string; value: string }[] =
    'task' in summary
      ? [{ key: 'hourlyRate', value: `${summary.hourlyRate} €/Std.` }]
      : [
          ...(summary.kostenstelle
            ? [
                {
                  key: 'kostenstelle',
                  value: summary.kostenstelle,
                },
              ]
            : []),
          ...(summary.kostentraeger
            ? [
                {
                  key: 'kostentraeger',
                  value: summary.kostentraeger,
                },
              ]
            : []),
          {
            key: 'invoiceNumberFormat',
            value: tFormat(summary.invoiceNumberFormat),
          },
        ];

  return (
    <div className="space-y-2">
      {task && <p className="text-sm text-foreground">{task}</p>}
      <div className="flex flex-wrap gap-2">
        {badgeItems.map((item) => (
          <Badge key={item.key} variant="outline">
            {item.value}
          </Badge>
        ))}
      </div>
    </div>
  );
}
