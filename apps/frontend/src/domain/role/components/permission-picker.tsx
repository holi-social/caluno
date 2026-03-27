'use client';

import type { Permission } from '@repo/data';
import { Card, Label, Separator, Switch } from '@repo/ui';

interface PermissionPickerProps {
  permissions: Permission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

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

function parsePermissionKey(key: string): { entity: string; action: string } {
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
}

function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const { entity } = parsePermissionKey(permission.key);
    const label = capitalize(entity);

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(permission);
  }

  return groups;
}

function getActionLabel(key: string): string {
  const { action } = parsePermissionKey(key);
  return capitalize(action);
}

export function PermissionPicker({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}: PermissionPickerProps) {
  const groups = groupPermissions(permissions);

  const togglePermission = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleGroup = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onChange(selectedIds.filter((id) => !groupIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...groupIds]);
      onChange([...newIds]);
    }
  };

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([groupName, groupPerms]) => {
        const groupIds = groupPerms.map((p) => p.id);
        const allSelected = groupIds.every((id) => selectedIds.includes(id));
        const someSelected =
          !allSelected && groupIds.some((id) => selectedIds.includes(id));

        return (
          <Card key={groupName} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">{groupName}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  {allSelected
                    ? 'All'
                    : someSelected
                      ? 'Partial'
                      : 'None'}
                </Label>
                <Switch
                  size="sm"
                  checked={allSelected}
                  onCheckedChange={() => toggleGroup(groupPerms)}
                  disabled={disabled}
                />
              </div>
            </div>
            <Separator className="mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {groupPerms.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5"
                >
                  <Label className="text-sm font-normal cursor-pointer">
                    {getActionLabel(permission.key)}
                  </Label>
                  <Switch
                    size="sm"
                    checked={selectedIds.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
