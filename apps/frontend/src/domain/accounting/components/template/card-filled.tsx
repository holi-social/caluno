'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { getPauschaleKey } from '../doc-type-header';
import { TemplateCardBadges } from './card-badges';
import { TemplateCardShell } from './card-shell';
import type { TemplateCardSummary } from './types';

interface TemplateCardFilledProps {
  pauschale: PauschalenType;
  kind: DocumentKind;
  summary: TemplateCardSummary;
  lastEditedAt: string;
  lastEditedBy: string;
  builderHref: string;
}

export function TemplateCardFilled({
  pauschale,
  kind,
  summary,
  lastEditedAt,
  lastEditedBy,
  builderHref,
}: TemplateCardFilledProps) {
  const t = useTranslations('Accounting.templates');
  const { formatDate } = useFormatting();

  const kindLabel = t(`documentKind.${kind}` as Parameters<typeof t>[0]);
  const typeLabel = t(
    `sections.${getPauschaleKey(pauschale)}` as Parameters<typeof t>[0],
  );

  return (
    <TemplateCardShell
      pauschale={pauschale}
      kind={kind}
      topLine={typeLabel}
      name={kindLabel}
      contentClassName="space-y-4"
      footer={
        <Button asChild type="button" variant="outline" className="w-full">
          <Link href={builderHref}>{t('card.editButton')}</Link>
        </Button>
      }
    >
      <TemplateCardBadges summary={summary} />

      <p className="text-sm text-muted-foreground">
        {t('card.lastEdited', {
          date: formatDate(new Date(lastEditedAt)),
          name: lastEditedBy,
        } as Parameters<typeof t>[1])}
      </p>
    </TemplateCardShell>
  );
}
