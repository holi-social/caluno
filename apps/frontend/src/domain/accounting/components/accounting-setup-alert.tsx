'use client';

import { Button } from '@repo/ui';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { SetupBlocker } from '../lib/setup-status';
import { getPauschaleKey } from './doc-type-header';

interface AccountingSetupAlertProps {
  blocker: SetupBlocker;
  orgUId: string;
}

/**
 * The persistent explanation of why an accounting action is unavailable, with
 * the way to fix it. Deliberately not dismissible: the action stays blocked
 * until the prerequisite is met, so hiding the reason would strand the admin.
 */
export function AccountingSetupAlert({
  blocker,
  orgUId,
}: AccountingSetupAlertProps) {
  const t = useTranslations('Accounting.setupAlert');
  const tSections = useTranslations('Accounting.templates.sections');
  const tFields = useTranslations('Accounting.orgProfileFields');

  const isOrgProfile = blocker.kind === 'org-profile';
  const href = isOrgProfile
    ? `/admin/${orgUId}`
    : `/admin/${orgUId}/accounting/settings?tab=templates`;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertCircleIcon
          size={16}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-card-foreground">
            {isOrgProfile ? t('orgProfileTitle') : t('templatesTitle')}
          </p>
          <p className="text-sm text-muted-foreground">
            {isOrgProfile
              ? t('orgProfileBody', {
                  fields: blocker.missingFields
                    .map((f) => tFields(f))
                    .join(', '),
                })
              : t('templatesBody', {
                  pauschalen: blocker.pauschalen
                    .map((p) => tSections(getPauschaleKey(p)))
                    .join(', '),
                })}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={href}>
          {isOrgProfile ? t('orgProfileCta') : t('templatesCta')}
        </Link>
      </Button>
    </div>
  );
}
