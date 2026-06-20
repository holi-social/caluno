'use client';

import {
  PermissionKey,
  useHasPermission,
  useRoles,
  useUpdateMembershipRoles,
} from '@repo/data/react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';

interface RoleSelectCellProps {
  membershipId: string;
  roles: Array<{ id: string; name: string; isInternal: boolean }>;
  orgUId: string;
}

export function RoleSelectCell({
  membershipId,
  roles,
  orgUId,
}: RoleSelectCellProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const canEdit = useHasPermission(PermissionKey.VolunteerEdit);
  const {
    data: availableRoles,
    isPending: rolesLoading,
    refetch: refetchRoles,
  } = useRoles();
  const { mutate: updateRoles, isPending: isUpdating } =
    useUpdateMembershipRoles();

  const t = useTranslations('Role');
  const tCommon = useTranslations('Common');
  const isOwner = roles.some(
    (role) => role.isInternal && role.name === 'Owner',
  );
  const systemRoles = roles.filter((role) => role.isInternal);
  const customRole = roles.find((role) => !role.isInternal);

  // Owner is always shown as plain text, no dropdown
  if (isOwner) {
    return <span className="text-sm">{t('owner')}</span>;
  }

  // Read-only users see custom role name or nothing
  if (!canEdit) {
    return customRole ? (
      <span className="text-sm">{customRole.name}</span>
    ) : (
      <span className="text-sm text-muted-foreground">{tCommon('dash')}</span>
    );
  }

  const systemRoleIds = systemRoles.map((role) => role.id);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) refetchRoles();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-40 h-auto min-h-8 px-2 py-1 justify-between"
          disabled={rolesLoading || isUpdating}
        >
          <span className="truncate">
            {customRole ? customRole.name : t('noRole')}
          </span>
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-40 p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={t('select.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('select.empty')}</CommandEmpty>
            <CommandGroup>
              {availableRoles
                ?.filter((role) => !role.isInternal)
                .map((role) => {
                  const isSelected = role.id === customRole?.id;
                  return (
                    <CommandItem
                      key={role.id}
                      value={role.name}
                      onSelect={() => {
                        if (!isSelected) {
                          updateRoles({
                            membershipId,
                            roleIds: [...systemRoleIds, role.id],
                          });
                        }
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <CheckIcon className="mr-2 size-4 text-primary" />
                      )}
                      <span
                        className={`truncate ${isSelected ? 'font-medium' : ''}`}
                      >
                        {role.name}
                      </span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  router.push(`/admin/${orgUId}/settings/roles/new`);
                }}
              >
                <PlusIcon className="mr-2 size-4" />
                {t('select.addCustom')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
