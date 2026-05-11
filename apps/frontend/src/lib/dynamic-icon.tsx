'use client';

import type { LucideProps } from 'lucide-react';
import { LoaderPinwheelIcon } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import dynamic from 'next/dynamic';

const iconCache = new Map<string, React.ComponentType<LucideProps>>();

const isLucideIconKey = (
  name: string,
): name is keyof typeof dynamicIconImports => {
  return name in dynamicIconImports;
};

export function getDynamicIcon(
  name: string,
  fallback: React.ComponentType<LucideProps>,
): React.ComponentType<LucideProps> {
  if (iconCache.has(name)) return iconCache.get(name)!;

  const loader = isLucideIconKey(name) ? dynamicIconImports[name] : undefined;
  const Icon = loader
    ? dynamic(loader, {
        loading: () => <LoaderPinwheelIcon className="animate-spin" />,
      })
    : fallback;
  iconCache.set(name, Icon);

  return Icon;
}
