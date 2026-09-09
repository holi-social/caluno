'use client';

import { DataError, PermissionKey, parseTemplateBody } from '@repo/data';
import {
  useActiveDocumentTemplate,
  useAdminUserProfile,
  useCreateContract,
  useCurrentOrg,
  useEffectiveRates,
  useOrgUId,
  usePermissions,
  useReimbursementTypes,
} from '@repo/data/react';
import { Input } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FORM_ID as ORG_UNIT_EDIT_SHEET_ID } from '@/domain/org-unit/components/org-unit-create-edit-sheet';
import { useRouter } from '@/i18n/navigation';
import {
  type DerivedField,
  deriveEditableFields,
} from '../lib/creation-fields';
import { contractPeriodForLifespan } from '../lib/creation-modal.utils';
import {
  apiDocumentKindFor,
  reimbursementTypeKeyFor,
} from '../lib/reimbursement-type-mapping';
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
  const router = useRouter();
  const permissionsQuery = usePermissions();

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

  const [derivedFields, setDerivedFields] = useState<DerivedField[] | null>(
    null,
  );
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendErrorCode, setSendErrorCode] = useState<string | null>(null);

  // Reset local edits whenever a different volunteer/pauschale is targeted —
  // the fields get re-seeded from the freshly loaded profile/template below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset keyed on identity change, not a dependency read by the effect body
  useEffect(() => {
    setDerivedFields(null);
    setEditedValues({});
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

  // The first query that failed carries the actual reason (e.g. "No contract
  // template configured for reimbursement type …") — shown in the dialog so
  // the coordinator can see what's really wrong, not just the generic copy.
  const loadError =
    typesQuery.error ??
    ratesQuery.error ??
    profileQuery.error ??
    templateQuery.error;

  // The most common blocker: the org has the reimbursement type but no
  // contract template yet (org-default or unit-override). Offer a direct CTA
  // to the template builder instead of a dead end.
  const noContractTemplate =
    templateQuery.error instanceof DataError &&
    templateQuery.error.options?.code === 'NOT_FOUND';
  const createTemplateCta = () =>
    router.push(`/admin/${orgUId}/accounting/settings/templates`);

  const status: DocumentCreationLoadStatus = hasError
    ? 'error'
    : sendError
      ? 'error'
      : dataReady
        ? 'loaded'
        : 'loading';

  // Seed the editable fields once from the loaded profile/template, then
  // leave them alone — further re-renders (e.g. rate data arriving late)
  // shouldn't clobber anything the coordinator already edited.
  useEffect(() => {
    if (!dataReady || !templateDoc || derivedFields || !volunteerName) return;
    const profileData = (profileQuery.data?.data ?? {}) as Record<
      string,
      unknown
    >;
    setDerivedFields(
      deriveEditableFields(templateDoc, profileData, volunteerName),
    );
  }, [dataReady, templateDoc, derivedFields, profileQuery.data, volunteerName]);

  // Rendered unconditionally (per the DocumentSheet precedent) so the Dialog
  // can drive its own open/close animation; nothing below needs the nullable
  // identity props once past this guard.
  if (!volunteerId || !volunteerName || !pauschale) return null;

  const isEdited = (fieldId: string) => Object.hasOwn(editedValues, fieldId);
  const currentValue = (
    fieldId: string,
    fallback: string | null,
  ): string | null =>
    isEdited(fieldId) ? (editedValues[fieldId] ?? null) : fallback;

  const handleFieldChange = (fieldId: string) => (value: string) => {
    setEditedValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSend = async () => {
    if (!reimbursementType || !templateDoc) return;
    setIsSending(true);
    setSendError(null);
    setSendErrorCode(null);
    const lifespan =
      (isEdited('contract-lifespan')
        ? editedValues['contract-lifespan']
        : getManualFieldValue(templateDoc, 'contract-lifespan')) ?? '';
    const { periodStart, periodEnd } = contractPeriodForLifespan(lifespan);
    try {
      await createContract.mutateAsync({
        organizationUnitId: orgUId,
        reimbursementTypeId: reimbursementType.id,
        volunteerId,
        periodStart,
        periodEnd,
        fieldOverrides: (derivedFields ?? []).flatMap((field) =>
          isEdited(field.fieldId)
            ? field.fieldIds.map((id) => ({
                fieldId: id,
                value: editedValues[field.fieldId] ?? '',
              }))
            : [],
        ),
      });
      onOpenChange(false);
      toast.success(t('sentToast', { name: volunteerName }));
      onSent();
    } catch (error) {
      // Surface the real server error (e.g. "No contract template configured
      // for reimbursement type …") instead of a generic "try again", and keep
      // the modal open so the coordinator can act on the reason.
      if (error instanceof Error) {
        setSendError(error.message || null);
        setSendErrorCode(
          error instanceof DataError ? (error.options?.code ?? null) : null,
        );
      } else {
        setSendError(null);
        setSendErrorCode(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const sendErrorIsNoTemplate = sendErrorCode === 'NOT_FOUND';
  const sendErrorIsOrgProfile = /organization is missing/i.test(
    sendError ?? '',
  );
  const canEditOrg =
    permissionsQuery.data?.some((p) => p.key === PermissionKey.OrgEdit) ??
    false;
  const editOrgProfileCta = () =>
    router.push(
      `/admin/${orgUId}/settings/org-units?sheet=${ORG_UNIT_EDIT_SHEET_ID}&id=${orgUId}`,
    );

  const pauschaleLabel = tPauschale(
    `type${getPauschaleKey(pauschale).toUpperCase()}` as Parameters<
      typeof tPauschale
    >[0],
  );

  const values: Partial<Record<DataSourceKey, string>> = {
    ...getKnownOrgValues({
      pauschale,
      orgName: org.name,
      orgAddress: org.address,
      orgCity: org.city,
      orgLegalRep: org.legalRep,
      hourlyRateCents: effectiveRate?.hourlyRateCents,
      yearlyLimitCents:
        effectiveRate?.reimbursementType.yearlyLimitCents ??
        reimbursementType?.yearlyLimitCents,
    }),
    generated_date: new Date().toLocaleDateString('de-DE'),
  };
  for (const field of derivedFields ?? []) {
    if (field.kind !== 'bound' || !field.source) continue;
    const value = currentValue(field.fieldId, field.value);
    if (value) values[field.source] = value;
  }

  const manualOverrides: Record<string, string> = {};
  for (const field of derivedFields ?? []) {
    if (field.kind !== 'manual') continue;
    const value = currentValue(field.fieldId, field.value);
    if (value) manualOverrides[field.fieldId] = value;
  }

  return (
    <DocumentCreationDialog
      open={open}
      onOpenChange={onOpenChange}
      embedded={embedded}
      title={t('title')}
      status={status}
      errorTitle={
        sendErrorIsOrgProfile
          ? t('orgProfileErrorTitle')
          : sendError
            ? t('sendErrorTitle')
            : t('loadErrorTitle')
      }
      errorDescription={
        sendErrorIsOrgProfile
          ? t('orgProfileErrorDescription')
          : sendError
            ? t('sendError', { name: volunteerName })
            : t('loadError', { name: volunteerName })
      }
      errorMessage={
        sendErrorIsOrgProfile
          ? undefined
          : (sendError ??
            (loadError instanceof Error ? loadError.message : undefined))
      }
      errorCtaLabel={
        sendErrorIsOrgProfile
          ? canEditOrg
            ? t('editProfileCta')
            : undefined
          : noContractTemplate || sendErrorIsNoTemplate
            ? t('noTemplateCta')
            : undefined
      }
      errorCtaAction={
        sendErrorIsOrgProfile
          ? canEditOrg
            ? editOrgProfileCta
            : undefined
          : noContractTemplate || sendErrorIsNoTemplate
            ? createTemplateCta
            : undefined
      }
      errorCtaCentered={sendErrorIsOrgProfile}
      fieldsSkeletonKeys={['lifespan', 'hours', 'name', 'iban', 'bic']}
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
            manualOverrides={manualOverrides}
          />
        )
      }
      fields={derivedFields?.map((field) =>
        field.kind === 'bound' ? (
          <AccountingProfileFieldCard
            key={field.fieldId}
            label={tFields(field.labelKey as Parameters<typeof tFields>[0])}
            value={currentValue(field.fieldId, field.value)}
            provenance={
              isEdited(field.fieldId)
                ? 'override'
                : field.provenance === 'template'
                  ? 'gap'
                  : field.provenance
            }
            volunteerName={volunteerName}
            docType="contract"
            onSave={handleFieldChange(field.fieldId)}
          />
        ) : (
          <InfoPanel
            key={field.fieldId}
            title={tManual(field.labelKey as Parameters<typeof tManual>[0])}
          >
            <Input
              className="mt-2"
              value={currentValue(field.fieldId, field.value) ?? ''}
              onChange={(e) => handleFieldChange(field.fieldId)(e.target.value)}
            />
          </InfoPanel>
        ),
      )}
    />
  );
}
