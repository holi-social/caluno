'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Volunteer = {
  checkInId: string;
  name: string;
};

type VolunteerCheckinProps = {
  organizationId: string;
  volunteers: Volunteer[];
};

export const VolunteerCheckin = ({
  volunteers,
  organizationId,
}: VolunteerCheckinProps) => {
  const router = useRouter();

  const handleCheckin = (checkInId: string) => {
    router.push(`/${organizationId}/check-in/${checkInId}/decide`);
  };

  return (
    <Select onValueChange={handleCheckin}>
      <SelectTrigger className="w-full max-w-64">
        <SelectValue placeholder="Select a volunteer" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {volunteers?.map((volunteer) => (
            <SelectItem key={volunteer.checkInId} value={volunteer.checkInId}>
              {volunteer.name} <LogIn />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
