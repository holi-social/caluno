'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ProfileFieldProvenance } from './accounting-profile-field-card';
import { AccountingProfileFieldCard } from './accounting-profile-field-card';
import { ContractPreviewMock } from './contract-preview-mock';
import type { PauschalenType } from './doc-type-header';
import { DEFAULT_PROFILE_DATA, MOCK_PROFILE_DATA } from './mock-profile-data';

type ProfileFieldKey = 'address' | 'iban' | 'dob' | 'taxId';

interface ProfileFieldState {
  value: string | null;
  provenance: ProfileFieldProvenance;
}

// Mock — a real org display name doesn't exist in the data model yet (dev dependency).
const MOCK_ORG_NAME = 'Musterverein e.V.';

type LoadStatus = 'loading' | 'loaded' | 'error';

interface ContractCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerId: string | null;
  volunteerName: string | null;
  pauschale: PauschalenType | null;
  onSent: () => void;
}

export function ContractCreationModal({
  open,
  onOpenChange,
  volunteerId,
  volunteerName,
  pauschale,
  onSent,
}: ContractCreationModalProps) {
  const t = useTranslations('Accounting.reimbursements.contractModal');
  const tFields = useTranslations('Accounting.templates.builder.dataSources');
  const tPauschale = useTranslations('Accounting.reimbursements.toolbar');

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [fields, setFields] = useState<Record<
    ProfileFieldKey,
    ProfileFieldState
  > | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus('loading');
    setFields(null);

    const timeout = setTimeout(() => {
      const data =
        (volunteerId && MOCK_PROFILE_DATA[volunteerId]) || DEFAULT_PROFILE_DATA;
      setFields({
        address: {
          value: data.address,
          provenance: data.address ? 'profile' : 'gap',
        },
        iban: { value: data.iban, provenance: data.iban ? 'profile' : 'gap' },
        dob: { value: data.dob, provenance: data.dob ? 'profile' : 'gap' },
        taxId: {
          value: data.taxId,
          provenance: data.taxId ? 'profile' : 'gap',
        },
      });
      setStatus('loaded');
    }, 350);

    return () => clearTimeout(timeout);
  }, [open, volunteerId]);

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

  const pauschaleLabel =
    pauschale === 'ehrenamt' ? tPauschale('typeEP') : tPauschale('typeUL');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {status === 'error' ? (
            <Alert variant="destructive">
              <AlertTitle>{t('loadErrorTitle')}</AlertTitle>
              <AlertDescription>
                {t('loadError', { name: volunteerName })}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
              <div>
                {status === 'loading' ? (
                  <Skeleton className="h-96 w-full rounded-xl" />
                ) : (
                  <ContractPreviewMock
                    volunteerName={volunteerName}
                    pauschale={pauschale}
                    pauschaleLabel={pauschaleLabel}
                    orgName={MOCK_ORG_NAME}
                    address={fields?.address.value ?? '—'}
                    iban={fields?.iban.value ?? '—'}
                    effectiveDate={new Date().toLocaleDateString()}
                  />
                )}
              </div>

              <div className="space-y-4">
                {status === 'loading' &&
                  ['address', 'iban', 'dob', 'taxId'].map((key) => (
                    <Skeleton key={key} className="h-24 w-full rounded-xl" />
                  ))}
                {status === 'loaded' && fields && (
                  <>
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
                      label={tFields('volunteer_dob')}
                      value={fields.dob.value}
                      provenance={fields.dob.provenance}
                      volunteerName={volunteerName}
                      docType="contract"
                      onSave={handleFieldSave('dob')}
                    />
                    <AccountingProfileFieldCard
                      label={tFields('volunteer_tax_id')}
                      value={fields.taxId.value}
                      provenance={fields.taxId.provenance}
                      volunteerName={volunteerName}
                      docType="contract"
                      onSave={handleFieldSave('taxId')}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={status !== 'loaded' || isSending}
          >
            {isSending ? t('sending') : t('sendForSigning')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
