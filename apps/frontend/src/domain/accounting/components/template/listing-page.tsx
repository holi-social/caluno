'use client';

import { Skeleton } from '@repo/ui';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TemplateCardEmpty } from './card-empty';
import { TemplateCardFilled } from './card-filled';
import { TemplateListingSection } from './listing-section';
import type { TemplateSectionData, TemplateSlot } from './types';

function TemplateSlotCard({
  slot,
  orgUId,
}: {
  slot: TemplateSlot;
  orgUId: string;
}) {
  const builderHref = `/admin/${orgUId}/accounting/templates/${slot.slug}`;

  if (!slot.configured) {
    return (
      <Link href={builderHref} className="contents">
        <TemplateCardEmpty
          slug={slot.slug}
          pauschale={slot.pauschale}
          kind={slot.kind}
        />
      </Link>
    );
  }

  return (
    <TemplateCardFilled
      slug={slot.slug}
      pauschale={slot.pauschale}
      kind={slot.kind}
      initialSignees={slot.signees}
      initialBlockedActions={slot.blockedActions}
      builderHref={builderHref}
    />
  );
}

interface TemplateListingPageProps {
  sections: TemplateSectionData[];
  orgUId: string;
}

export function TemplateListingPage({
  sections,
  orgUId,
}: TemplateListingPageProps) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <TemplateListingSection
          key={section.pauschale}
          pauschale={section.pauschale}
          hasUnconfigured={section.slots.some((s) => !s.configured)}
        >
          {section.slots.map((slot) => (
            <TemplateSlotCard key={slot.slug} slot={slot} orgUId={orgUId} />
          ))}
        </TemplateListingSection>
      ))}
    </div>
  );
}

export function TemplateListingPageSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((sectionIdx) => (
        <section key={sectionIdx} className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-xl border bg-card flex flex-col overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-8 w-8 rounded-[5px] shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-5 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full rounded-[6px]" />
                </div>
                <div className="mt-auto border-t p-3">
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TemplateListingPageError() {
  const t = useTranslations('Accounting.templates');
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
      <AlertCircleIcon
        size={16}
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <p>{t('loadError')}</p>
    </div>
  );
}
