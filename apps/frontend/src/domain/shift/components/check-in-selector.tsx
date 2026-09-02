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

/** Base UI combobox item shape — the input shows `label` (the name), `value` keeps the check-in id. */
type VolunteerOption = {
  value: string;
  label: string;
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

  const handleCheckin = (option: VolunteerOption | null) => {
    if (option?.value)
      router.push(
        `/admin/${organizationUnitId}/check-in/${option.value}/decide`,
      );
  };

  return (
    <Combobox
      items={volunteers.map((v) => ({ value: v.checkInId, label: v.name }))}
      onValueChange={handleCheckin}
    >
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
          {(option: VolunteerOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label} <ScanQrCode />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
