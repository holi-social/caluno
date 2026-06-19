'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  InputGroupAddon,
} from '@repo/ui';
import { LogIn, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type Volunteer = {
  checkInId: string;
  name: string;
};

type VolunteerCheckinProps = {
  organizationUnitId: string;
  volunteers: Volunteer[];
};

export const CheckInSelector = ({
  volunteers,
  organizationUnitId,
}: VolunteerCheckinProps) => {
  const router = useRouter();
  const t = useTranslations('Shift');

  const handleCheckin = (checkInId: string | null) => {
    if (checkInId)
      router.push(`/admin/${organizationUnitId}/check-in/${checkInId}/decide`);
  };

  return (
    <Combobox items={volunteers} onValueChange={handleCheckin}>
      <ComboboxInput
        placeholder={t('checkInSelector.placeholder')}
        className="w-full max-w-72"
      >
        <InputGroupAddon>
          <User />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>{t('checkInSelector.empty')}</ComboboxEmpty>
        <ComboboxList>
          {(volunteer: Volunteer) => (
            <ComboboxItem key={volunteer.checkInId} value={volunteer.checkInId}>
              {volunteer.name} <LogIn />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
