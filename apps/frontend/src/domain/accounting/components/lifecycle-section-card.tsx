'use client';

import { Button, cn, Skeleton, Switch } from '@repo/ui';
import { LockIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DocumentKind, PauschalenType } from './doc-type-header';
import { DocTypeHeader } from './doc-type-header';
import {
  SigningChainEditable,
  type SigningStep,
} from './signing-chain-editable';

export type DocumentRelationship = 'unrelated' | 'blocking';

export interface LifecycleDocument {
  id: string;
  kind: DocumentKind;
  pauschale: PauschalenType;
  name: string;
  signingSteps: SigningStep[];
}

// Mocked initial data — dev pipeline replaces with real queries
const MOCK_DOCUMENTS: LifecycleDocument[] = [
  {
    id: 'doc-1',
    kind: 'contract',
    pauschale: 'ep',
    name: 'Contract',
    signingSteps: [
      { id: 's1', role: 'volunteer' },
      { id: 's2', role: 'coordinator' },
    ],
  },
  {
    id: 'doc-2',
    kind: 'invoice',
    pauschale: 'ep',
    name: 'Invoice',
    signingSteps: [
      { id: 's3', role: 'volunteer' },
      { id: 's4', role: 'coordinator' },
    ],
  },
];

// One relationship per adjacent pair; index i is between doc[i] and doc[i+1]
const MOCK_RELATIONSHIPS: DocumentRelationship[] = ['blocking'];

interface RelationshipConnectorProps {
  relationship: DocumentRelationship;
  editable: boolean;
  onChange: (r: DocumentRelationship) => void;
}

function RelationshipConnector({
  relationship,
  editable,
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

      <span className="text-xs">
        {isBlocking ? t('relationship.blocking') : t('relationship.unrelated')}
      </span>

      {editable && (
        <Switch
          className="ml-auto"
          checked={isBlocking}
          onCheckedChange={(checked) =>
            onChange(checked ? 'blocking' : 'unrelated')
          }
          aria-label={
            isBlocking
              ? t('relationship.blocking')
              : t('relationship.unrelated')
          }
        />
      )}
    </div>
  );
}

interface DocumentItemProps {
  doc: LifecycleDocument;
  editable: boolean;
  onStepsChange: (steps: SigningStep[]) => void;
  onEditToggle: () => void;
  isEditing: boolean;
}

function DocumentItem({
  doc,
  editable,
  onStepsChange,
  onEditToggle,
  isEditing,
}: DocumentItemProps) {
  const t = useTranslations('Accounting.settings.lifecycle');
  const tCommon = useTranslations('Common');

  return (
    <div className="rounded-xl border bg-background px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <DocTypeHeader
          kind={doc.kind}
          pauschale={doc.pauschale}
          topLine={t(
            `pauschaleLabel.${doc.pauschale}` as Parameters<typeof t>[0],
          )}
          name={doc.name}
        />
        {editable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditToggle}
            className="shrink-0 text-sm"
          >
            {isEditing ? tCommon('cancel') : tCommon('edit')}
          </Button>
        )}
      </div>

      <div className="ml-10">
        <SigningChainEditable
          steps={doc.signingSteps}
          editable={isEditing}
          onStepsChange={onStepsChange}
        />
      </div>
    </div>
  );
}

export function LifecycleSectionCard() {
  const t = useTranslations('Accounting.settings.lifecycle');
  const tCommon = useTranslations('Common');

  const [documents, setDocuments] =
    useState<LifecycleDocument[]>(MOCK_DOCUMENTS);
  const [relationships, setRelationships] =
    useState<DocumentRelationship[]>(MOCK_RELATIONSHIPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [globalEditable, setGlobalEditable] = useState(false);

  function updateDocSteps(docId: string, steps: SigningStep[]) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, signingSteps: steps } : d)),
    );
  }

  function updateRelationship(index: number, rel: DocumentRelationship) {
    setRelationships((prev) => prev.map((r, i) => (i === index ? rel : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setGlobalEditable((v) => !v);
            setEditingId(null);
          }}
        >
          {globalEditable ? tCommon('done') : tCommon('edit')}
        </Button>
      </div>

      <div>
        {documents.length === 0 && !globalEditable && (
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
            <DocumentItem
              doc={doc}
              editable={globalEditable}
              isEditing={editingId === doc.id}
              onEditToggle={() =>
                setEditingId(editingId === doc.id ? null : doc.id)
              }
              onStepsChange={(steps) => updateDocSteps(doc.id, steps)}
            />

            {index < documents.length - 1 && (
              <RelationshipConnector
                relationship={relationships[index] ?? 'unrelated'}
                editable={globalEditable}
                onChange={(rel) => updateRelationship(index, rel)}
              />
            )}
          </div>
        ))}

        {globalEditable && (
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              disabled
            >
              <PlusIcon size={14} />
              {t('addDocument')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LifecycleSectionCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      <div className="space-y-0">
        <div className="rounded-xl border px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-[5px]" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="ml-10 flex gap-2">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-4 w-4 self-center" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-1">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="rounded-xl border px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-[5px]" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
          <div className="ml-10 flex gap-2">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-4 w-4 self-center" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
