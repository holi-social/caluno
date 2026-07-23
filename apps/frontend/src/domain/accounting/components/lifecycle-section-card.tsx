'use client';

import { Button, cn, Skeleton, Switch } from '@repo/ui';
import { LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DocumentKind, PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';

const PAUSCHALE_I18N_KEY: Record<PauschalenType, 'ep' | 'ul'> = {
  ehrenamt: 'ep',
  uebungleiter: 'ul',
};

export type DocumentRelationship = 'unrelated' | 'blocking';

export interface LifecycleDocument {
  id: string;
  kind: DocumentKind;
  pauschale: PauschalenType;
  name: string;
}

const MOCK_DOCUMENTS: LifecycleDocument[] = [
  {
    id: 'doc-1',
    kind: 'contract',
    pauschale: 'ehrenamt',
    name: 'Contract',
  },
  {
    id: 'doc-2',
    kind: 'invoice',
    pauschale: 'ehrenamt',
    name: 'Invoice',
  },
];

const MOCK_RELATIONSHIPS: DocumentRelationship[] = ['blocking'];

interface RelationshipConnectorProps {
  relationship: DocumentRelationship;
  onChange: (r: DocumentRelationship) => void;
}

function RelationshipConnector({
  relationship,
  onChange,
}: RelationshipConnectorProps) {
  const t = useTranslations('Accounting.settings.lifecycle');
  const isBlocking = relationship === 'blocking';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-1',
        isBlocking ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <div className="flex flex-col items-center self-stretch">
        <div
          className={cn(
            'w-px flex-1',
            isBlocking ? 'bg-border' : 'bg-border/40',
          )}
          aria-hidden="true"
        />
        {isBlocking && (
          <LockIcon
            size={12}
            className="my-1 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            'w-px flex-1',
            isBlocking ? 'bg-border' : 'bg-border/40',
          )}
          aria-hidden="true"
        />
      </div>

      <span className="text-sm">
        {isBlocking ? t('relationship.blocking') : t('relationship.unrelated')}
      </span>

      <Switch
        className="ml-auto"
        checked={isBlocking}
        onCheckedChange={(checked) =>
          onChange(checked ? 'blocking' : 'unrelated')
        }
        aria-label={
          isBlocking ? t('relationship.blocking') : t('relationship.unrelated')
        }
      />
    </div>
  );
}

interface DocumentItemProps {
  doc: LifecycleDocument;
}

function DocumentItem({ doc }: DocumentItemProps) {
  const t = useTranslations('Accounting.settings.lifecycle');

  return (
    <div className="rounded-xl border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <DocTypeHeader
          kind={doc.kind}
          pauschale={doc.pauschale}
          topLine={t(
            `pauschaleLabel.${PAUSCHALE_I18N_KEY[doc.pauschale]}` as Parameters<
              typeof t
            >[0],
          )}
          name={doc.name}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-sm"
        >
          {t('editTemplate')}
        </Button>
      </div>
    </div>
  );
}

export function LifecycleSectionCard() {
  const t = useTranslations('Accounting.settings.lifecycle');

  const [documents] = useState<LifecycleDocument[]>(MOCK_DOCUMENTS);
  const [relationships, setRelationships] =
    useState<DocumentRelationship[]>(MOCK_RELATIONSHIPS);

  function updateRelationship(index: number, rel: DocumentRelationship) {
    setRelationships((prev) => prev.map((r, i) => (i === index ? rel : r)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>

      <div>
        {documents.length === 0 && (
          <div className="py-6 text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('noDocuments')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('noDocumentsHint')}
            </p>
          </div>
        )}

        {documents.map((doc, index) => (
          <div key={doc.id}>
            <DocumentItem doc={doc} />
            {index < documents.length - 1 && (
              <RelationshipConnector
                relationship={relationships[index] ?? 'unrelated'}
                onChange={(rel) => updateRelationship(index, rel)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LifecycleSectionCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-80" />
      <div className="space-y-0">
        <div className="rounded-xl border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-[5px]" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-1">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <div className="rounded-xl border px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-[5px]" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
