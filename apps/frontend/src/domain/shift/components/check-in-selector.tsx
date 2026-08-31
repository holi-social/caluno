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
import { ScanQrCode, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type Volunteer = {
  checkInId: string;
  name: string;
};

type VolunteerCheckinProps = {
  organizationUnitId: string;
  volunteers: Volunteer[];
  /**
   * Portal target for the combobox popup. Pass the dialog content element when
   * rendered inside a Radix Dialog — otherwise the popup lands on `<body>`,
   * outside the dialog's pointer-events/scroll-lock shard, and is unclickable.
   */
  portalContainer?: HTMLElement | null;
};

export const CheckInSelector = ({
  volunteers,
  organizationUnitId,
  portalContainer,
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
      <ComboboxContent container={portalContainer}>
        <ComboboxEmpty>{t('checkInSelector.empty')}</ComboboxEmpty>
        <ComboboxList>
          {(volunteer: Volunteer) => (
            <ComboboxItem key={volunteer.checkInId} value={volunteer.checkInId}>
              {volunteer.name} <ScanQrCode />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
