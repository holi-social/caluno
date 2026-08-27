import { Badge } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { TemplateCardSummary } from './types';

interface TemplateCardBadgesProps {
  summary: TemplateCardSummary;
}

export function TemplateCardBadges({ summary }: TemplateCardBadgesProps) {
  const tCard = useTranslations('Accounting.templates.card');
  const tRates = useTranslations('Accounting.settings.rates');
  const tFormat = useTranslations(
    'Accounting.templates.builder.invoiceNumberFormats',
  );

  const badgeItems: { key: string; value: string }[] = [];

  if (summary.kind === 'contract' && summary.hourlyRate) {
    badgeItems.push({
      key: 'hourlyRate',
      value: `${summary.hourlyRate}${tRates('rateUnit')}`,
    });
  }

  if (summary.kind === 'invoice' && summary.invoiceNumberFormat) {
    badgeItems.push({
      key: 'invoiceNumberFormat',
      value: tFormat(summary.invoiceNumberFormat),
    });
  }

  if (summary.renewalCadence) {
    badgeItems.push({
      key: 'renewalCadence',
      value: tCard(
        `badges.renewal.${summary.renewalCadence.toLowerCase()}` as Parameters<
          typeof tCard
        >[0],
      ),
    });
  }

  if (summary.signeeCount !== undefined) {
    badgeItems.push({
      key: 'signees',
      value: tCard('badges.signees', {
        count: summary.signeeCount,
      } as Parameters<typeof tCard>[1]),
    });
  }

  return (
    <div className="space-y-2">
      {summary.kind === 'contract' && summary.task && (
        <p className="text-sm text-foreground">{summary.task}</p>
      )}
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
