import type { Block, FormConfig } from './types';

export type Role = 'admin' | 'moderator';

export type User = {
  id: string;
  name: string;
  role: Role;
  subOrg: string;
  avatarInitials: string;
};

export const USERS: User[] = [
  {
    id: 'andrea',
    name: 'Andrea',
    role: 'admin',
    subOrg: 'Abteilung EA',
    avatarInitials: 'AE',
  },
  {
    id: 'karl',
    name: 'Karl',
    role: 'moderator',
    subOrg: 'Karlstrasse 13',
    avatarInitials: 'KS',
  },
];

export const USER_COOKIE = 'form-builder-user';
const DEFAULT_USER_ID = 'andrea';

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function getCurrentUserFromCookieValue(
  value: string | undefined,
): User {
  if (value) {
    const user = getUserById(value);
    if (user) return user;
  }
  return getUserById(DEFAULT_USER_ID)!;
}

// --- Permission helpers ---

export function canEditBlock(user: User, block: Block): boolean {
  return user.role === 'admin' || block.createdBy === user.id;
}

export function canDeleteBlock(user: User, block: Block): boolean {
  return user.role === 'admin' || block.createdBy === user.id;
}

export function canEditForm(user: User, form: FormConfig): boolean {
  return user.role === 'admin' || form.createdBy === user.id;
}

export function canDeleteForm(user: User, form: FormConfig): boolean {
  return user.role === 'admin' || form.createdBy === user.id;
}

export function canRemoveBlockFromForm(user: User): boolean {
  return user.role === 'admin';
}
