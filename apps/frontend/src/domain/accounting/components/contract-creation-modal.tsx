'use client';

import { Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ProfileFieldProvenance } from './accounting-profile-field-card';
import { AccountingProfileFieldCard } from './accounting-profile-field-card';
import { getPauschaleKey, type PauschalenType } from './doc-type-header';
import {
  DocumentCreationDialog,
  type DocumentCreationLoadStatus,
} from './document-creation-dialog';
import { InfoPanel } from './info-panel';
import { DEFAULT_PROFILE_DATA, MOCK_PROFILE_DATA } from './mock-profile-data';
import { getKnownOrgValues } from './template/builder-document-presets';
import type { DataSourceKey } from './template/builder-types';
import { getManualFieldValue } from './template/builder-types';
import { GeneratedDocumentPreview } from './template/generated-document-preview';
import {
  CONTRACT_DEFAULT_HOURS_AMOUNT,
  CONTRACT_DEFAULT_LIFESPAN,
  MOCK_SAVED_TEMPLATES,
  templateSlugFor,
} from './template/mock-saved-templates';

type ProfileFieldKey = 'address' | 'iban' | 'bic' | 'dob';

interface ProfileFieldState {
  value: string | null;
  provenance: ProfileFieldProvenance;
}

// Mock — a real org display name doesn't exist in the data model yet (dev dependency).
const MOCK_ORG_NAME = 'Musterverein e.V.';

/** "Anna Müller" -> { first: "Anna", last: "Müller" } — matches the Vorname/Nachname fields the contract text binds separately. */
function splitName(name: string): { first: string; last: string } {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first: first ?? name, last: rest.join(' ') };
}

interface ContractCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerId: string | null;
  volunteerName: string | null;
  pauschale: PauschalenType | null;
  onSent: () => void;
  /** See DocumentCreationDialog's embedded mode. */
  embedded?: boolean;
}

export function ContractCreationModal({
  open,
  onOpenChange,
  volunteerId,
  volunteerName,
  pauschale,
  onSent,
  embedded,
}: ContractCreationModalProps) {
  const t = useTranslations('Accounting.reimbursements.contractModal');
  const tFields = useTranslations('Accounting.templates.builder.dataSources');
  const tManual = useTranslations(
    'Accounting.templates.builder.manualFieldLabels',
  );
  const tPauschale = useTranslations('Accounting.reimbursements.toolbar');

  const [status, setStatus] = useState<DocumentCreationLoadStatus>('loading');
  const [fields, setFields] = useState<Record<
    ProfileFieldKey,
    ProfileFieldState
  > | null>(null);
  const [lifespan, setLifespan] = useState('');
  const [hoursAmount, setHoursAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open || !pauschale) return;
    setStatus('loading');
    setFields(null);
    setLifespan(CONTRACT_DEFAULT_LIFESPAN[pauschale]);
    setHoursAmount(CONTRACT_DEFAULT_HOURS_AMOUNT[pauschale]);

    const timeout = setTimeout(() => {
      const data =
        (volunteerId && MOCK_PROFILE_DATA[volunteerId]) || DEFAULT_PROFILE_DATA;
      setFields({
        address: {
          value: data.address,
          provenance: data.address ? 'profile' : 'gap',
        },
        iban: { value: data.iban, provenance: data.iban ? 'profile' : 'gap' },
        bic: { value: data.bic, provenance: data.bic ? 'profile' : 'gap' },
        dob: { value: data.dob, provenance: data.dob ? 'profile' : 'gap' },
      });
      setStatus('loaded');
    }, 350);

    return () => clearTimeout(timeout);
  }, [open, volunteerId, pauschale]);

  // Rendered unconditionally (per the DocumentSheet precedent) so the Dialog
  // can drive its own open/close animation; nothing below needs the nullable
  // identity props once past this guard.
  if (!volunteerId || !volunteerName || !pauschale) return null;

  const handleFieldSave = (key: ProfileFieldKey) => (value: string) => {
    setFields((prev) =>
      prev ? { ...prev, [key]: { value, provenance: 'override' } } : prev,
    );
  };

  const handleSend = async () => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSending(false);
    onOpenChange(false);
    toast.success(t('sentToast', { name: volunteerName }));
    onSent();
  };

  const pauschaleLabel = tPauschale(
    `type${getPauschaleKey(pauschale).toUpperCase()}` as Parameters<
      typeof tPauschale
    >[0],
  );

  const template =
    MOCK_SAVED_TEMPLATES[templateSlugFor(pauschale, 'contract')].document;
  // Baked into the template, not chosen per document — shown as read-only context next to the amount input.
  const hoursUnit = getManualFieldValue(template, 'hours-unit') ?? 'Monat';
  const hoursUnitLabel =
    hoursUnit === 'Woche' ? t('hoursUnitWeek') : t('hoursUnitMonth');
  const { first, last } = splitName(volunteerName);

  const values: Partial<Record<DataSourceKey, string>> = {
    ...getKnownOrgValues(pauschale),
    volunteer_first_name: first,
    volunteer_last_name: last,
    volunteer_address: fields?.address.value ?? undefined,
    volunteer_dob: fields?.dob.value ?? undefined,
    volunteer_iban: fields?.iban.value ?? undefined,
    volunteer_bic: fields?.bic.value ?? undefined,
    generated_date: new Date().toLocaleDateString('de-DE'),
  };

  return (
    <DocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      embedded={embedded}
      title={t('title')}
      status={status}
      errorTitle={t('loadErrorTitle')}
      errorDescription={t('loadError', { name: volunteerName })}
      fieldsSkeletonKeys={['address', 'iban', 'dob', 'lifespan', 'hours']}
      cancelLabel={t('cancel')}
      sendLabel={t('sendForSigning')}
      sendingLabel={t('sending')}
      isSending={isSending}
      onSend={handleSend}
      preview={
        <GeneratedDocumentPreview
          document={template}
          kind="contract"
          pauschale={pauschale}
          pauschaleLabel={pauschaleLabel}
          documentTitle={t('preview.documentTitle')}
          orgName={MOCK_ORG_NAME}
          disclaimerLabel={t('preview.disclaimerBadge')}
          signerLeftLabel={t('preview.signatureVolunteer')}
          signerRightLabel={t('preview.signatureCoordinator')}
          unsignedLabel={t('preview.unsigned')}
          values={values}
          manualOverrides={{
            'contract-lifespan': lifespan,
            'hours-amount': hoursAmount,
          }}
        />
      }
      fields={
        fields && (
          <>
            <InfoPanel title={tManual('contract-lifespan')}>
              <Input
                className="mt-2"
                value={lifespan}
                onChange={(e) => setLifespan(e.target.value)}
                placeholder="MM/JJJJ"
              />
            </InfoPanel>
            <InfoPanel title={tManual('hours-amount')}>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={hoursAmount}
                  onChange={(e) => setHoursAmount(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  {t('hoursUnitHint', { unit: hoursUnitLabel })}
                </span>
              </div>
            </InfoPanel>
            <AccountingProfileFieldCard
              label={tFields('volunteer_address')}
              value={fields.address.value}
              provenance={fields.address.provenance}
              volunteerName={volunteerName}
              docType="contract"
              onSave={handleFieldSave('address')}
            />
            <AccountingProfileFieldCard
              label={tFields('volunteer_iban')}
              value={fields.iban.value}
              provenance={fields.iban.provenance}
              volunteerName={volunteerName}
              docType="contract"
              onSave={handleFieldSave('iban')}
            />
            <AccountingProfileFieldCard
              label={tFields('volunteer_bic')}
              value={fields.bic.value}
              provenance={fields.bic.provenance}
              volunteerName={volunteerName}
              docType="contract"
              onSave={handleFieldSave('bic')}
            />
            <AccountingProfileFieldCard
              label={tFields('volunteer_dob')}
              value={fields.dob.value}
              provenance={fields.dob.provenance}
              volunteerName={volunteerName}
              docType="contract"
              onSave={handleFieldSave('dob')}
            />
          </>
        )
      }
    />
  );
}
