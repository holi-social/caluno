'use client';

import { useUserOrganizations } from '@repo/data/react';
import {
  Button,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { cn } from '@repo/ui/utils';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentOrgId = params.orgId as string | undefined;

  const organizations = useUserOrganizations();

  const handleOrgChange = (newOrgId: string) => {
    if (newOrgId === currentOrgId) {
      setOpen(false);
      return;
    }

    const pathParts = pathname.split('/').filter(Boolean);
    const currentPage = pathParts.length > 1 ? pathParts[1] : 'shifts';

    router.push(`/${newOrgId}/${currentPage}`);
    setOpen(false);
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentOrg?.name || 'Select organization'}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={() => handleOrgChange(org.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentOrgId === org.id ? 'opacity-100' : 'opacity-0',
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
