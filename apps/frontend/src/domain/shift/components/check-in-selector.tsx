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
import { useRouter } from 'next/navigation';

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

  const handleCheckin = (checkInId: string | null) => {
    if (checkInId)
      router.push(`/admin/${organizationUnitId}/check-in/${checkInId}/decide`);
  };

  return (
    <Combobox items={volunteers} onValueChange={handleCheckin}>
      <ComboboxInput
        placeholder="Select a volunteer"
        className="w-full max-w-72"
      >
        <InputGroupAddon>
          <User />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>No volunteer found</ComboboxEmpty>
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
