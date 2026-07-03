import { notFound } from 'next/navigation';
import { DevTemplateBuilderPreview } from '@/domain/accounting/components/template/builder-dev-preview';
import type { DocumentKind, PauschalenType } from '@/domain/accounting/components/doc-type-header';
import type { TemplateSlug } from '@/domain/accounting/components/template/types';

const SLUG_MAP: Record<TemplateSlug, { pauschale: PauschalenType; kind: DocumentKind }> = {
  'ehrenamtspauschale-contract': { pauschale: 'ehrenamt', kind: 'contract' },
  'ehrenamtspauschale-invoice': { pauschale: 'ehrenamt', kind: 'invoice' },
  'uebungsleiterpauschale-contract': { pauschale: 'uebungleiter', kind: 'contract' },
  'uebungsleiterpauschale-invoice': { pauschale: 'uebungleiter', kind: 'invoice' },
};

interface DevTemplateBuilderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DevTemplateBuilderPage({ params }: DevTemplateBuilderPageProps) {
  const { slug } = await params;
  const resolved = SLUG_MAP[slug as TemplateSlug];

  if (!resolved) notFound();

  return (
    <DevTemplateBuilderPreview
      pauschale={resolved.pauschale}
      kind={resolved.kind}
      backHref="/dev/accounting-templates"
    />
  );
}
