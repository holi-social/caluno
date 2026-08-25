import { Card, cn } from '@repo/ui';
import { ChevronRightIcon, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface PublicListCardProps {
  href: string;
  eyebrow?: string;
  title: string;
  metaIcon: LucideIcon;
  metaText: string;
  /** Visual "no longer available" state (e.g. fully booked). Stays navigable. */
  muted?: boolean;
}

export function PublicListCard({
  href,
  eyebrow,
  title,
  metaIcon: MetaIcon,
  metaText,
  muted,
}: PublicListCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Card
        className={cn(
          'flex flex-row items-center justify-between gap-3 p-3.5',
          muted && 'bg-muted',
        )}
      >
        <div className="flex flex-col gap-1">
          {eyebrow ? (
            <p className="text-base text-muted-foreground">{eyebrow}</p>
          ) : null}
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <MetaIcon className="size-4" />
            {metaText}
          </p>
        </div>
        <ChevronRightIcon className="size-5 text-muted-foreground" />
      </Card>
    </Link>
  );
}
