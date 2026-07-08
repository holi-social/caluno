'use client';

import { Button } from '@repo/ui';
import { useState } from 'react';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { TemplateBuilder } from './builder';
import type { PlacedField } from './builder-types';

const MOCK_FIELDS_CLEAN: PlacedField[] = [
  { id: 'f1', dataSource: 'volunteer_first_name', profileGap: false },
  { id: 'f2', dataSource: 'volunteer_last_name', profileGap: false },
  { id: 'f3', dataSource: 'total_amount', profileGap: false },
  { id: 'f4', dataSource: 'volunteer_iban', profileGap: false },
  { id: 'f5', dataSource: 'org_name', profileGap: false },
];

const MOCK_FIELDS_WITH_GAP: PlacedField[] = [
  { id: 'f1', dataSource: 'volunteer_first_name', profileGap: false },
  { id: 'f2', dataSource: 'volunteer_last_name', profileGap: false },
  { id: 'f3', dataSource: 'total_amount', profileGap: false },
  { id: 'f4', dataSource: 'volunteer_iban', profileGap: true },
  { id: 'f5', dataSource: 'volunteer_dob', profileGap: true },
];

const MOCK_FIELDS_UNBOUND: PlacedField[] = [
  { id: 'f1', dataSource: 'volunteer_first_name', profileGap: false },
  { id: 'f2', dataSource: null, profileGap: false },
  { id: 'f3', dataSource: 'total_amount', profileGap: false },
  { id: 'f4', dataSource: null, profileGap: false },
];

type BuilderVariant = 'upload' | 'active' | 'gap' | 'unbound';

const VARIANT_LABELS: Record<BuilderVariant, string> = {
  upload: 'Upload state',
  active: 'Designer active',
  gap: 'Profile gap warning',
  unbound: 'Save blocked (unbound)',
};

interface DevTemplateBuilderPreviewProps {
  pauschale?: PauschalenType;
  kind?: DocumentKind;
  backHref?: string;
}

export function DevTemplateBuilderPreview({
  pauschale = 'ehrenamt',
  kind = 'contract',
  backHref,
}: DevTemplateBuilderPreviewProps) {
  const [variant, setVariant] = useState<BuilderVariant>('upload');

  const getFields = (): PlacedField[] | undefined => {
    if (variant === 'upload') return undefined;
    if (variant === 'active') return MOCK_FIELDS_CLEAN;
    if (variant === 'gap') return MOCK_FIELDS_WITH_GAP;
    return MOCK_FIELDS_UNBOUND;
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 shrink-0">
        <span className="text-xs text-muted-foreground mr-2">Dev preview:</span>
        {(Object.keys(VARIANT_LABELS) as BuilderVariant[]).map((v) => (
          <Button
            key={v}
            type="button"
            variant={variant === v ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setVariant(v)}
          >
            {VARIANT_LABELS[v]}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <TemplateBuilder
          key={variant}
          pauschale={pauschale}
          kind={kind}
          initialFields={getFields()}
          backHref={backHref}
        />
      </div>
    </div>
  );
}
