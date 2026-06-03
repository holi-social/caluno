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
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  searchPlaceholder = 'Search...',
  searchSuggestions,
  filters,
  sort,
  trailing,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  searchSuggestions?: string[];
  filters: FilterDef[];
  sort?: SortDef;
  trailing?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const matches = useMemo(() => {
    if (!searchSuggestions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return searchSuggestions
      .filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      .slice(0, 8);
  }, [search, searchSuggestions]);
  const showSuggestions = focused && matches.length > 0;
  const safeActiveIndex =
    activeIndex >= 0 && activeIndex < matches.length ? activeIndex : -1;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  useEffect(() => {
    if (safeActiveIndex < 0) return;
    itemRefs.current[safeActiveIndex]?.scrollIntoView({ block: 'nearest' });
  }, [safeActiveIndex]);

  function commit(value: string) {
    onSearchChange(value);
    setFocused(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(true);
      setActiveIndex((i) => (i + 1 >= matches.length ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(true);
      setActiveIndex((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && safeActiveIndex >= 0) {
      e.preventDefault();
      const choice = matches[safeActiveIndex];
      if (choice) commit(choice);
    } else if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault();
      setFocused(false);
    } else if (e.key === 'Home' && showSuggestions) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && showSuggestions) {
      e.preventDefault();
      setActiveIndex(matches.length - 1);
    }
  }

  return (
    <div className="space-y-4">
      {trailing && <div className="flex justify-end">{trailing}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="h-10 pl-9"
            role={searchSuggestions ? 'combobox' : undefined}
            aria-expanded={searchSuggestions ? showSuggestions : undefined}
            aria-controls={searchSuggestions ? listboxId : undefined}
            aria-autocomplete={searchSuggestions ? 'list' : undefined}
            aria-activedescendant={
              safeActiveIndex >= 0
                ? `${listboxId}-${safeActiveIndex}`
                : undefined
            }
          />
          {showSuggestions && (
            <div
              id={listboxId}
              role="listbox"
              className="bg-popover text-popover-foreground absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border p-1 shadow-md"
            >
              {matches.map((s, idx) => {
                const active = idx === safeActiveIndex;
                return (
                  <div key={s} role="presentation">
                    <button
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      id={`${listboxId}-${idx}`}
                      aria-selected={active}
                      className={`w-full rounded-sm px-2 py-1.5 text-left text-sm ${
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(s);
                      }}
                    >
                      {s}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
        {sort && (
          <Select value={sort.value} onValueChange={sort.onChange}>
            <SelectTrigger size="default" className="h-10 min-w-40">
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
        )}
      </div>
    </div>
  );
}
