'use client';

import type { GetPermissionGroupsQuery } from '@repo/data';
import { Card, Label, Separator, Switch } from '@repo/ui';

type PermissionGroup = GetPermissionGroupsQuery['permissionGroups'][number];

interface PermissionPickerProps {
  groups: PermissionGroup[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({
  groups,
  selectedIds,
  onChange,
  disabled = false,
}: PermissionPickerProps) {
  const togglePermission = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupIds = group.items.map((item) => item.permission.id);
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
      {groups.map((group) => {
        const groupIds = group.items.map((item) => item.permission.id);
        const allSelected = groupIds.every((id) => selectedIds.includes(id));
        const someSelected =
          !allSelected && groupIds.some((id) => selectedIds.includes(id));

        return (
          <Card key={group.key} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">{group.label}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  {allSelected ? 'All' : someSelected ? 'Partial' : 'None'}
                </Label>
                <Switch
                  size="sm"
                  checked={allSelected}
                  onCheckedChange={() => toggleGroup(group)}
                  disabled={disabled}
                />
              </div>
            </div>
            <Separator className="mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((item) => (
                <div
                  key={item.permission.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5"
                >
                  <Label className="text-sm font-normal cursor-pointer">
                    {item.label}
                  </Label>
                  <Switch
                    size="sm"
                    checked={selectedIds.includes(item.permission.id)}
                    onCheckedChange={() => togglePermission(item.permission.id)}
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
