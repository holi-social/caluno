'use client';

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Search } from 'lucide-react';

export type FilterDef = {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export type SortDef = {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export function ListControls({
  search,
  onSearchChange,
  searchPlaceholder = 'Suchen...',
  filters,
  sort,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  filters: FilterDef[];
  sort: SortDef;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 pl-9"
        />
      </div>
      {filters.map((f) => (
        <Select key={f.id} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger size="default" className="h-10 min-w-40">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <Select value={sort.value} onValueChange={sort.onChange}>
        <SelectTrigger size="default" className="h-10 min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sort.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
