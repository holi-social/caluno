import { cn } from '@repo/ui';
import { CalendarDaysIcon, ChevronRightIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { DetailCoverImage, DetailLogoImage } from './detail-entity-image';

interface DetailHeroBadge {
  label: string;
  /** Omit for a plain type-indicator badge (no navigation). */
  href?: string;
}

interface DetailHeroOrg {
  name: string;
  href: string;
}

interface DetailHeroLogo {
  url?: string | null;
  /** Fallback shown when `url` is absent. */
  initials: string;
}

interface DetailHeroProps {
  title: string;
  coverImageUrl?: string | null;
  coverImageAlt: string;
  badge?: DetailHeroBadge | null;
  org?: DetailHeroOrg | null;
  /** Logo chip above the title (e.g. org page). Mutually exclusive with `badge` in practice. */
  logo?: DetailHeroLogo | null;
  /** Plain, non-navigable subtitle under the title (e.g. org page tagline). Mutually exclusive with `org`. */
  tagline?: string | null;
}

export function DetailHero({
  title,
  coverImageUrl,
  coverImageAlt,
  badge,
  org,
  logo,
  tagline,
}: DetailHeroProps) {
  const onImage = Boolean(coverImageUrl);

  const badgeClassName = cn(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-base font-medium',
    onImage
      ? 'bg-black/70 text-white'
      : 'bg-muted-foreground/10 text-foreground',
  );

  return (
    <div className="relative h-60 w-full bg-muted md:h-[300px]">
      {coverImageUrl ? (
        <>
          <DetailCoverImage
            src={coverImageUrl}
            alt={coverImageAlt}
            className="h-full md:h-full rounded-none border-0"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(9,9,11,0) 0%, rgba(9,9,11,0.94) 100%)',
            }}
          />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 pb-6 md:pb-12">
        <div
          className={cn(
            'mx-auto flex max-w-[1400px] flex-col items-start px-4 md:px-20',
            logo ? 'gap-3' : 'gap-2',
          )}
        >
          {logo ? (
            logo.url ? (
              <DetailLogoImage src={logo.url} alt="" className="size-12" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-card text-lg font-bold text-foreground">
                {logo.initials}
              </div>
            )
          ) : null}
          {badge ? (
            badge.href ? (
              <Link href={badge.href} className={badgeClassName}>
                <CalendarDaysIcon className="size-3.5 shrink-0" />
                {badge.label}
                <ChevronRightIcon className="size-3.5 shrink-0" />
              </Link>
            ) : (
              <span className={badgeClassName}>
                <CalendarDaysIcon className="size-3.5 shrink-0" />
                {badge.label}
              </span>
            )
          ) : null}
          <h1
            className={cn(
              'text-[27px] font-bold leading-tight',
              onImage ? 'text-white' : 'text-foreground',
            )}
          >
            {title}
          </h1>
          {org ? (
            <Link
              href={org.href}
              className={cn(
                'inline-flex items-center gap-1.5 text-base font-medium hover:underline',
                onImage ? 'text-white/85' : 'text-muted-foreground',
              )}
            >
              <span className="line-clamp-2">{org.name}</span>
              <ChevronRightIcon className="size-4 shrink-0" />
            </Link>
          ) : null}
          {tagline ? (
            <p
              className={cn(
                'line-clamp-2 text-base',
                onImage ? 'text-white/80' : 'text-muted-foreground',
              )}
            >
              {tagline}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
