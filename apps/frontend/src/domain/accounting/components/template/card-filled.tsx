'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { Link } from '@/i18n/navigation';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { DocTypeHeader, getPauschaleKey } from '../doc-type-header';
import { TemplateCardBadges } from './card-badges';
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
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      <div className="p-4 space-y-4">
        <DocTypeHeader
          kind={kind}
          pauschale={pauschale}
          topLine={typeLabel}
          name={kindLabel}
        />

        <TemplateCardBadges summary={summary} />

        <p className="text-sm text-muted-foreground">
          {t('card.lastEdited', {
            date: formatDate(new Date(lastEditedAt)),
            name: lastEditedBy,
          } as Parameters<typeof t>[1])}
        </p>
      </div>

      <div className="mt-auto border-t p-3">
        <Button asChild type="button" variant="outline" className="w-full">
          <Link href={builderHref}>{t('card.editButton')}</Link>
        </Button>
      </div>
    </div>
  );
}
