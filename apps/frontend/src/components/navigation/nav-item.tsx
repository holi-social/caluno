import { cn } from '@repo/ui';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

export function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-4 py-3 md:px-9 md:py-3 rounded-4xl font-bold text-sm hover:cursor-pointer flex-1 max-w-36',
        active ? 'bg-ring' : 'hover:bg-accent',
      )}
    >
      <Icon className={cn('size-6', active && 'text-white')} />
      <span>{label}</span>
    </Link>
  );
}
