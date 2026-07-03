'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { DocTypeHeader } from '../doc-type-header';
import { TemplateBlockedActions } from './blocked-actions';
import { TemplateSigneeChain } from './signee-chain';
import type { BlockedAction, Signee, TemplateSlug } from './types';

interface TemplateCardFilledProps {
  slug: TemplateSlug;
  pauschale: PauschalenType;
  kind: DocumentKind;
  initialSignees: Signee[];
  initialBlockedActions: BlockedAction[];
  builderHref: string;
}

export function TemplateCardFilled({
  slug,
  pauschale,
  kind,
  initialSignees,
  initialBlockedActions,
  builderHref,
}: TemplateCardFilledProps) {
  const t = useTranslations('Accounting.templates');
  const [signees, setSignees] = useState<Signee[]>(initialSignees);
  const [blockedActions, setBlockedActions] = useState<BlockedAction[]>(
    initialBlockedActions,
  );

  const kindLabel = t(`documentKind.${kind}` as Parameters<typeof t>[0]);
  const typeLabel = t(
    `sections.${pauschale === 'ehrenamt' ? 'ep' : 'ul'}` as Parameters<
      typeof t
    >[0],
  );

  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <DocTypeHeader
            kind={kind}
            pauschale={pauschale}
            topLine={typeLabel}
            name={kindLabel}
          />
          <Link
            href={builderHref}
            className="shrink-0 inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {t('card.editButton')}
          </Link>
        </div>

        <div className="border-t pt-4">
          <TemplateSigneeChain signees={signees} onSigneesChange={setSignees} />
        </div>

        <div className="border-t pt-4">
          <TemplateBlockedActions
            slug={slug}
            actions={blockedActions}
            onActionsChange={setBlockedActions}
          />
        </div>
      </div>
    </div>
  );
}
