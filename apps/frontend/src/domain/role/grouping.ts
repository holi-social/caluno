import type { Permission } from '@repo/data';

const ACTIONS = new Set([
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'CANCEL',
  'PUBLISH',
]);

export const groupPermissions = (permissions: Permission[]) => {
  const groups = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const { entity } = parsePermissionKey(permission.key);
    const label = capitalize(entity);

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)?.push(permission);
  }

  return groups;
};

export const getActionLabel = (key: string): string => {
  const { action } = parsePermissionKey(key);
  return capitalize(action);
};

const parsePermissionKey = (
  key: string,
): { entity: string; action: string } => {
  const parts = key.split('_');
  for (let i = parts.length - 1; i > 0; i--) {
    const part = parts[i];
    if (part !== undefined && ACTIONS.has(part)) {
      const entity = parts.slice(0, i).join(' ');
      const action = parts.slice(i).join(' ');
      return { entity, action };
    }
  }
  return { entity: key, action: key };
};

const capitalize = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
