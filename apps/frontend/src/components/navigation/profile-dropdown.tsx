import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { Crown, SettingsIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileDropdownProps {
  userName: string;
  userImage?: string | null;
}

export function ProfileDropdown({ userName, userImage }: ProfileDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full p-0">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="size-10 bg-accent rounded-full p-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <div className="px-2 py-1.5 text-sm font-medium truncate">
          {userName}
        </div>
        <hr className="my-1" />
        <Link
          href={`/volunteering/profile`}
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <SettingsIcon className="h-4 w-4" />
          Edit profile
        </Link>
        <Link
          href={'/'}
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Crown className="h-4 w-4" />
          Backoffice
        </Link>
      </PopoverContent>
    </Popover>
  );
}
