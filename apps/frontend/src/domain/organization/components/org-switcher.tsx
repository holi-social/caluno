'use client';

import { useUserOrganizations } from '@repo/data/react';
import {
  Button,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { orgUnitAdminHref, switchOrgAdminHref } from '@/lib/admin-routes';

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const currentorgUId = params.orgUId as string | undefined;

  const organizations = useUserOrganizations();

  const orgHref = (orgUId: string) =>
    orgUId === currentorgUId
      ? orgUnitAdminHref(orgUId)
      : switchOrgAdminHref(orgUId, pathname);

  const currentOrg = organizations.find((org) => org.id === currentorgUId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3!"
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="shrink-0" />
            <span className="truncate">
              {currentOrg?.name || 'Select organization'}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem key={org.id} value={org.id} asChild>
                  <Link href={orgHref(org.id)} onClick={() => setOpen(false)}>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentorgUId === org.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{org.name}</span>
                      {org.description && (
                        <span className="text-xs text-muted-foreground">
                          {org.description}
                        </span>
                      )}
                    </div>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
