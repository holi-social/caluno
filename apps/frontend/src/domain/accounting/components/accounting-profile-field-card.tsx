'use client';

import { useTranslations } from 'next-intl';
import { ProfileFieldCard } from '@/components/profile-field-card';

export type ProfileFieldProvenance = 'profile' | 'override' | 'gap';

interface AccountingProfileFieldCardProps {
  label: string;
  value: string | null;
  provenance: ProfileFieldProvenance;
  volunteerName: string;
  /** Which document this field belongs to — picks the right noun in the "only editing for this ___" hints. */
  docType: 'contract' | 'invoice';
  onSave: (value: string) => void;
  className?: string;
}

export function AccountingProfileFieldCard({
  label,
  value,
  provenance,
  volunteerName,
  docType,
  onSave,
  className,
}: AccountingProfileFieldCardProps) {
  const t = useTranslations('Accounting.reimbursements.profileField');

  const subline =
    provenance === 'profile'
      ? t('fromProfileHint', { name: volunteerName })
      : provenance === 'override'
        ? t('overrideHint', { docType })
        : t('gapHint', { name: volunteerName, docType });

  return (
    <ProfileFieldCard
      label={label}
      value={value}
      missingValueLabel={t('missingValue')}
      subline={subline}
      editingSubline={t('editingHint', { name: volunteerName, docType })}
      editButtonLabel={t('editButtonLabel')}
      saveButtonLabel={t('saveButtonLabel')}
      isEmptyValue={provenance === 'gap'}
      onSave={onSave}
      className={className}
    />
  );
}
