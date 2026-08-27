import { notFound } from 'next/navigation';
import { TemplateBuilder } from '@/domain/accounting/components/template/builder';
import {
  SLUG_TO_SLOT,
  type TemplateSlug,
} from '@/domain/accounting/components/template/types';

interface TemplateBuilderPageProps {
  params: Promise<{ orgUId: string; slug: string }>;
}

export default async function TemplateBuilderPage({
  params,
}: TemplateBuilderPageProps) {
  const { orgUId, slug } = await params;
  const slot = SLUG_TO_SLOT[slug as TemplateSlug];

  if (!slot) notFound();

  return (
    <TemplateBuilder
      pauschale={slot.pauschale}
      kind={slot.kind}
      backHref={`/admin/${orgUId}/accounting/settings`}
    />
  );
}
