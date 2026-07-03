'use client';

import { Button } from '@repo/ui';
import { useState } from 'react';
import {
  TemplateListingPage,
  TemplateListingPageError,
  TemplateListingPageSkeleton,
} from './listing-page';
import type { TemplateSectionData } from './types';

const MOCK_ALL_EMPTY: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      {
        slug: 'ehrenamtspauschale-contract',
        pauschale: 'ehrenamt',
        kind: 'contract',
        configured: false,
        signees: [],
        blockedActions: [],
      },
      {
        slug: 'ehrenamtspauschale-invoice',
        pauschale: 'ehrenamt',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
      },
    ],
  },
  {
    pauschale: 'uebungleiter',
    slots: [
      {
        slug: 'uebungsleiterpauschale-contract',
        pauschale: 'uebungleiter',
        kind: 'contract',
        configured: false,
        signees: [],
        blockedActions: [],
      },
      {
        slug: 'uebungsleiterpauschale-invoice',
        pauschale: 'uebungleiter',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
      },
    ],
  },
];

const MOCK_MIXED: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      {
        slug: 'ehrenamtspauschale-contract',
        pauschale: 'ehrenamt',
        kind: 'contract',
        configured: true,
        signees: [
          { id: 's1', role: 'volunteer' },
          { id: 's2', role: 'coordinator' },
        ],
        blockedActions: [
          { id: 'a1', gate: 'check_in' },
          { id: 'a2', gate: 'shift_signup' },
        ],
      },
      {
        slug: 'ehrenamtspauschale-invoice',
        pauschale: 'ehrenamt',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
      },
    ],
  },
  {
    pauschale: 'uebungleiter',
    slots: [
      {
        slug: 'uebungsleiterpauschale-contract',
        pauschale: 'uebungleiter',
        kind: 'contract',
        configured: true,
        signees: [{ id: 's3', role: 'volunteer' }],
        blockedActions: [{ id: 'a3', gate: 'document_ul_invoice' }],
      },
      {
        slug: 'uebungsleiterpauschale-invoice',
        pauschale: 'uebungleiter',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
      },
    ],
  },
];

const MOCK_ALL_CONFIGURED: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      {
        slug: 'ehrenamtspauschale-contract',
        pauschale: 'ehrenamt',
        kind: 'contract',
        configured: true,
        signees: [
          { id: 's1', role: 'volunteer' },
          { id: 's2', role: 'coordinator' },
        ],
        blockedActions: [{ id: 'a1', gate: 'check_in' }],
      },
      {
        slug: 'ehrenamtspauschale-invoice',
        pauschale: 'ehrenamt',
        kind: 'invoice',
        configured: true,
        signees: [{ id: 's3', role: 'volunteer' }],
        blockedActions: [
          { id: 'a2', gate: 'shift_signup' },
          { id: 'a3', gate: 'document_ep_contract' },
        ],
      },
    ],
  },
  {
    pauschale: 'uebungleiter',
    slots: [
      {
        slug: 'uebungsleiterpauschale-contract',
        pauschale: 'uebungleiter',
        kind: 'contract',
        configured: true,
        signees: [{ id: 's4', role: 'volunteer' }],
        blockedActions: [],
      },
      {
        slug: 'uebungsleiterpauschale-invoice',
        pauschale: 'uebungleiter',
        kind: 'invoice',
        configured: true,
        signees: [
          { id: 's5', role: 'volunteer' },
          { id: 's6', role: 'hq_manager' },
        ],
        blockedActions: [{ id: 'a4', gate: 'document_ul_contract' }],
      },
    ],
  },
];

type ViewState = 'all-empty' | 'mixed' | 'all-configured' | 'loading' | 'error';

const MOCK_BY_STATE: Record<
  Exclude<ViewState, 'loading' | 'error'>,
  TemplateSectionData[]
> = {
  'all-empty': MOCK_ALL_EMPTY,
  mixed: MOCK_MIXED,
  'all-configured': MOCK_ALL_CONFIGURED,
};

const STATE_LABELS: Record<ViewState, string> = {
  'all-empty': 'All empty',
  mixed: 'Mixed',
  'all-configured': 'All configured',
  loading: 'Loading',
  error: 'Error',
};

export function DevTemplateListingPreview() {
  const [viewState, setViewState] = useState<ViewState>('mixed');

  return (
    <div className="py-10 px-8 space-y-6">
      <div>
        <h1 className="page-title">Document Templates</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dev preview — no auth required
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-4">
        {(Object.keys(STATE_LABELS) as ViewState[]).map((state) => (
          <Button
            key={state}
            type="button"
            variant={viewState === state ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewState(state)}
          >
            {STATE_LABELS[state]}
          </Button>
        ))}
      </div>

      {viewState === 'loading' && <TemplateListingPageSkeleton />}
      {viewState === 'error' && <TemplateListingPageError />}
      {viewState !== 'loading' && viewState !== 'error' && (
        <TemplateListingPage
          sections={MOCK_BY_STATE[viewState]}
          orgUId="dev-org"
        />
      )}
    </div>
  );
}
