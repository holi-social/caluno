'use client';

import { BuildingIcon } from 'lucide-react';
import Image from 'next/image';
import { getDynamicIcon } from '@/lib/dynamic-icon';

type Props = {
  name: string;
  logoUrl?: string | null;
  typeIcon: string;
};

export function OrgUnitAvatar({ name, logoUrl, typeIcon }: Props) {
  const TypeIcon = getDynamicIcon(typeIcon, BuildingIcon);

  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={32}
          height={32}
          className="size-8 object-cover"
        />
      ) : (
        <TypeIcon className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}
