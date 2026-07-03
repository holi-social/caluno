'use client';

import { Button } from '@repo/ui';
import { TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { DocTypeHeader } from '../doc-type-header';
import type { TemplateSlug } from './types';

interface TemplateCardEmptyProps {
  slug: TemplateSlug;
  pauschale: PauschalenType;
  kind: DocumentKind;
}

export function TemplateCardEmpty({
  slug: _slug,
  pauschale,
  kind,
}: TemplateCardEmptyProps) {
  const t = useTranslations('Accounting.templates');
  const tCard = useTranslations('Accounting.templates.card.empty');

  const kindLabel = t(`documentKind.${kind}` as Parameters<typeof t>[0]);
  const typeLabel = t(
    `sections.${pauschale === 'ehrenamt' ? 'ep' : 'ul'}` as Parameters<
      typeof t
    >[0],
  );

  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      <div className="p-4 space-y-3">
        <DocTypeHeader
          kind={kind}
          pauschale={pauschale}
          topLine={typeLabel}
          name={kindLabel}
        />

        <div className="flex items-start gap-2 rounded-md border border-alert bg-card p-2 text-sm text-alert">
          <TriangleAlertIcon
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{tCard('alertText')}</span>
        </div>
      </div>

      <div className="mt-auto border-t p-3">
        <Button type="button" variant="outline" className="w-full">
          {tCard('createButton')}
        </Button>
      </div>
    </div>
  );
}
