'use client';

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
} from '@repo/ui';
import { UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Volunteer = {
  checkInId: string;
  name: string;
};

type CheckInSelectorProps = {
  volunteers: Volunteer[];
  selectedCheckInId: string | null;
  onSelectedCheckInIdChange: (checkInId: string) => void;
};

export const CheckInSelector = ({
  volunteers,
  selectedCheckInId,
  onSelectedCheckInIdChange,
}: CheckInSelectorProps) => {
  const t = useTranslations('CheckIn');

  return (
    <Command forceShowInput className="flex min-h-0 flex-1 flex-col">
      <CommandInput placeholder={t('searchVolunteerPlaceholder')} />
      <CommandList className="max-h-none flex-1">
        <CommandEmpty>{t('noVolunteersFound')}</CommandEmpty>
        {volunteers.map((volunteer) => {
          const isSelected = selectedCheckInId === volunteer.checkInId;

          return (
            <CommandItem
              key={volunteer.checkInId}
              value={volunteer.name}
              onSelect={() => onSelectedCheckInIdChange(volunteer.checkInId)}
              className={cn(
                'cursor-pointer justify-between',
                isSelected && 'bg-accent text-accent-foreground',
              )}
            >
              {volunteer.name}
              {isSelected && <UserCheck />}
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
};
