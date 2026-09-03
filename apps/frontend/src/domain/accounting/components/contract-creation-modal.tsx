'use client';

import { parseTemplateBody } from '@repo/data';
import {
  useActiveDocumentTemplate,
  useAdminUserProfile,
  useCreateContract,
  useCurrentOrg,
  useEffectiveRates,
  useOrgUId,
  useReimbursementTypes,
} from '@repo/data/react';
import { Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { contractPeriodForLifespan } from '../lib/creation-modal.utils';
import {
  apiDocumentKindFor,
  reimbursementTypeKeyFor,
} from '../lib/reimbursement-type-mapping';
import type { ProfileFieldProvenance } from './accounting-profile-field-card';
import { AccountingProfileFieldCard } from './accounting-profile-field-card';
import { getPauschaleKey, type PauschalenType } from './doc-type-header';
import {
  DocumentCreationDialog,
  type DocumentCreationLoadStatus,
} from './document-creation-dialog';
import { InfoPanel } from './info-panel';
import { getKnownOrgValues } from './template/builder-document-presets';
import type { DataSourceKey } from './template/builder-types';
import { getManualFieldValue } from './template/builder-types';
import { GeneratedDocumentPreview } from './template/generated-document-preview';

type ProfileFieldKey = 'address' | 'iban' | 'bic' | 'dob';

interface ProfileFieldState {
  value: string | null;
  provenance: ProfileFieldProvenance;
}

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

  const orgUId = useOrgUId();
  const org = useCurrentOrg();

  const typesQuery = useReimbursementTypes();
  const ratesQuery = useEffectiveRates(orgUId);
  const profileQuery = useAdminUserProfile(volunteerId ?? '');

  const reimbursementTypeKey = pauschale
    ? reimbursementTypeKeyFor(pauschale)
    : undefined;
  const reimbursementType = typesQuery.data?.find(
    (type) => type.key === reimbursementTypeKey,
  );
  const effectiveRate = ratesQuery.data?.find(
    (rate) => rate.reimbursementType.key === reimbursementTypeKey,
  );

  const templateQuery = useActiveDocumentTemplate(
    apiDocumentKindFor('contract'),
    reimbursementType?.id,
    orgUId,
  );
  const templateDoc = templateQuery.data
    ? parseTemplateBody(templateQuery.data.body)
    : null;

  const createContract = useCreateContract();

  const [fields, setFields] = useState<Record<
    ProfileFieldKey,
    ProfileFieldState
  > | null>(null);
  const [lifespan, setLifespan] = useState('');
  const [hoursAmount, setHoursAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Reset local edits whenever a different volunteer/pauschale is targeted —
  // the fields get re-seeded from the freshly loaded profile/template below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset keyed on identity change, not a dependency read by the effect body
  useEffect(() => {
    setFields(null);
    setLifespan('');
    setHoursAmount('');
  }, [volunteerId, pauschale]);

  const profileLoaded = !!volunteerId && profileQuery.isSuccess;
  const reimbursementTypeMissing =
    typesQuery.isSuccess && !!pauschale && !reimbursementType;
  const dataReady =
    !!templateDoc &&
    profileLoaded &&
    !!reimbursementType &&
    ratesQuery.isSuccess;
  const hasError =
    typesQuery.isError ||
    ratesQuery.isError ||
    profileQuery.isError ||
    templateQuery.isError ||
    reimbursementTypeMissing;

  const status: DocumentCreationLoadStatus = hasError
    ? 'error'
    : dataReady
      ? 'loaded'
      : 'loading';

  // Seed the editable fields once from the loaded profile/template, then
  // leave them alone — further re-renders (e.g. rate data arriving late)
  // shouldn't clobber anything the coordinator already edited.
  useEffect(() => {
    if (!dataReady || !templateDoc || fields) return;
    const profileData = (profileQuery.data?.data ?? {}) as Record<
      string,
      unknown
    >;
    const address =
      typeof profileData.address === 'string' ? profileData.address : null;
    const iban = typeof profileData.iban === 'string' ? profileData.iban : null;
    const dob =
      typeof profileData['birth-date'] === 'string'
        ? profileData['birth-date']
        : null;
    setFields({
      address: { value: address, provenance: address ? 'profile' : 'gap' },
      iban: { value: iban, provenance: iban ? 'profile' : 'gap' },
      // No BIC field exists in the requirement-profile system yet (see
      // system-profile-fields.ts) — always a gap until that's added.
      bic: { value: null, provenance: 'gap' },
      dob: { value: dob, provenance: dob ? 'profile' : 'gap' },
    });
    setLifespan(getManualFieldValue(templateDoc, 'contract-lifespan') ?? '');
    setHoursAmount(getManualFieldValue(templateDoc, 'hours-amount') ?? '');
  }, [dataReady, templateDoc, fields, profileQuery.data]);

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
    if (!reimbursementType) return;
    setIsSending(true);
    const { periodStart, periodEnd } = contractPeriodForLifespan(lifespan);
    try {
      await createContract.mutateAsync({
        organizationUnitId: orgUId,
        reimbursementTypeId: reimbursementType.id,
        volunteerId,
        periodStart,
        periodEnd,
      });
      onOpenChange(false);
      toast.success(t('sentToast', { name: volunteerName }));
      onSent();
    } catch {
      toast.error(t('sendErrorToast', { name: volunteerName }));
    } finally {
      setIsSending(false);
    }
  };

  const pauschaleLabel = tPauschale(
    `type${getPauschaleKey(pauschale).toUpperCase()}` as Parameters<
      typeof tPauschale
    >[0],
  );

  // Baked into the template, not chosen per document — shown as read-only context next to the amount input.
  const hoursUnit = templateDoc
    ? (getManualFieldValue(templateDoc, 'hours-unit') ?? 'Monat')
    : 'Monat';
  const hoursUnitLabel =
    hoursUnit === 'Woche' ? t('hoursUnitWeek') : t('hoursUnitMonth');
  const { first, last } = splitName(volunteerName);

  const values: Partial<Record<DataSourceKey, string>> = {
    ...getKnownOrgValues({
      pauschale,
      orgName: org.name,
      orgAddress: org.address,
      // orgCity/orgLegalRep: no such field exists on the org profile yet
      // (see OrganizationData) — a real gap, left unresolved rather than
      // invented.
      hourlyRateCents: effectiveRate?.hourlyRateCents,
      yearlyLimitCents:
        effectiveRate?.reimbursementType.yearlyLimitCents ??
        reimbursementType?.yearlyLimitCents,
    }),
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
        templateDoc && (
          <GeneratedDocumentPreview
            document={templateDoc}
            kind="contract"
            pauschale={pauschale}
            pauschaleLabel={pauschaleLabel}
            documentTitle={t('preview.documentTitle')}
            orgName={org.name}
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
        )
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
