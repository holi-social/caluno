'use client';

import { useUserOrganizations } from '@repo/data/react';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { Button } from '@repo/ui/button';
import { cn } from '@repo/ui/utils';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentOrgSlug = params.orgSlug as string | undefined;

  const organizations = useUserOrganizations();

  const handleOrgChange = (newOrgSlug: string) => {
    if (newOrgSlug === currentOrgSlug) {
      setOpen(false);
      return;
    }

    const pathParts = pathname.split('/').filter(Boolean);
    const currentPage = pathParts.length > 1 ? pathParts[1] : 'shifts';

    router.push(`/${newOrgSlug}/${currentPage}`);
    setOpen(false);
  };

  const currentOrg = organizations.find((org) => org.slug === currentOrgSlug);

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
                  value={org.slug}
                  onSelect={() => handleOrgChange(org.slug)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentOrgSlug === org.slug ? 'opacity-100' : 'opacity-0',
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
