'use client';

import { useDocumentTemplates, useEffectiveRates } from '@repo/data/react';
import { Skeleton } from '@repo/ui';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { centsToEuros, formatHourlyRate } from '../../lib/money';
import { reimbursementTypeKeyFor } from '../../lib/reimbursement-type-mapping';
import {
  asInvoiceNumberFormat,
  findSlotTemplate,
} from '../../lib/template-slots';
import type { PauschalenType } from '../doc-type-header';
import { TemplateCardEmpty } from './card-empty';
import { TemplateCardFilled } from './card-filled';
import { TemplateListingSection } from './listing-section';
import type { TemplateSectionData, TemplateSlot, TemplateSlug } from './types';
import { SLUG_TO_SLOT } from './types';

const PAUSCHALE_ORDER: PauschalenType[] = ['ehrenamt', 'uebungsleiter'];

function TemplateSlotCard({
  slot,
  orgUId,
  builderBasePath,
}: {
  slot: TemplateSlot;
  orgUId: string;
  builderBasePath?: string;
}) {
  const builderHref = `${builderBasePath ?? `/admin/${orgUId}/accounting/settings/templates`}/${slot.slug}`;

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
      pauschale={slot.pauschale}
      kind={slot.kind}
      summary={slot.summary}
      lastEditedAt={slot.lastEditedAt}
      lastEditedBy={slot.lastEditedBy}
      builderHref={builderHref}
    />
  );
}

interface TemplateListingPageProps {
  orgUId: string;
  builderBasePath?: string;
}

export function TemplateListingPage({
  orgUId,
  builderBasePath,
}: TemplateListingPageProps) {
  const templatesQuery = useDocumentTemplates();
  const ratesQuery = useEffectiveRates(orgUId);

  if (templatesQuery.isLoading || ratesQuery.isLoading) {
    return <TemplateListingPageSkeleton />;
  }

  if (templatesQuery.isError || ratesQuery.isError) {
    return <TemplateListingPageError />;
  }

  const buildSlot = (
    slug: TemplateSlug,
    pauschale: PauschalenType,
    kind: 'contract' | 'invoice',
  ): TemplateSlot => {
    const template = findSlotTemplate(templatesQuery.data, {
      pauschale,
      kind,
      organizationUnitId: orgUId,
    });

    if (!template) {
      return { slug, pauschale, kind, configured: false };
    }

    const rateCents = ratesQuery.data?.find(
      (rate) =>
        rate.reimbursementType.key === reimbursementTypeKeyFor(pauschale),
    )?.hourlyRateCents;

    return {
      slug,
      pauschale,
      kind,
      configured: true,
      templateId: template.id,
      summary:
        kind === 'contract'
          ? {
              kind,
              hourlyRate:
                rateCents !== undefined
                  ? formatHourlyRate(centsToEuros(rateCents))
                  : undefined,
              renewalCadence: template.renewalCadence,
              signeeCount: template.signees.length,
            }
          : {
              kind,
              invoiceNumberFormat: asInvoiceNumberFormat(
                template.invoiceNumberFormat,
              ),
              renewalCadence: template.renewalCadence,
              signeeCount: template.signees.length,
            },
      lastEditedAt: template.lastEditedAt ?? null,
      lastEditedBy: template.lastEditedByUser?.name ?? null,
    };
  };

  const sections: TemplateSectionData[] = PAUSCHALE_ORDER.map((pauschale) => {
    const slots = (
      Object.entries(SLUG_TO_SLOT) as [
        TemplateSlug,
        { pauschale: PauschalenType; kind: 'contract' | 'invoice' },
      ][]
    )
      .filter(([, slotInfo]) => slotInfo.pauschale === pauschale)
      .map(([slug, slotInfo]) => buildSlot(slug, pauschale, slotInfo.kind));
    return { pauschale, slots } as TemplateSectionData;
  });

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <TemplateListingSection
          key={section.pauschale}
          pauschale={section.pauschale}
          hasUnconfigured={section.slots.some((s) => !s.configured)}
        >
          {section.slots.map((slot) => (
            <TemplateSlotCard
              key={slot.slug}
              slot={slot}
              orgUId={orgUId}
              builderBasePath={builderBasePath}
            />
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
