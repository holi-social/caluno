'use client';

import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { Check, ChevronDown } from 'lucide-react';
import { USERS, type User } from '@/lib/users';

export function UserSwitcher({ currentUser }: { currentUser: User }) {
  const router = useRouter();

  async function switchUser(userId: string) {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
            {currentUser.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{currentUser.name}</span>
        <ChevronDown className="text-muted-foreground size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        {USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            onClick={() => switchUser(user.id)}
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground text-xs">
                {user.role === 'admin' ? 'Admin' : 'Moderator'} &middot;{' '}
                {user.subOrg}
              </div>
            </div>
            {user.id === currentUser.id && (
              <Check className="text-primary size-4 shrink-0" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
