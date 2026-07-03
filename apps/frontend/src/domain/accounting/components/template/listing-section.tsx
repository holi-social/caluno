'use client';

import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

const SECTION_I18N_KEY = {
  ehrenamt: 'ep',
  uebungleiter: 'ul',
} as const;

type SectionPauschale = keyof typeof SECTION_I18N_KEY;

interface TemplateListingSectionProps {
  pauschale: SectionPauschale;
  hasUnconfigured: boolean;
  children: ReactNode;
}

export function TemplateListingSection({
  pauschale,
  hasUnconfigured,
  children,
}: TemplateListingSectionProps) {
  const t = useTranslations('Accounting.templates.sections');
  const key = SECTION_I18N_KEY[pauschale];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t(key)}</h2>

      {hasUnconfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-3 text-base text-muted-foreground">
          <AlertCircleIcon
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>{t('unconfiguredWarning')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}
