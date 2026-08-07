import { cn } from '@repo/ui/utils';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getInitials } from '@/lib/get-initials';
import type { PendingInviteOrg } from '@/lib/pending-invite-org';
import { AuthBrand } from './auth-brand';

interface AuthJoinHeaderProps {
  org: PendingInviteOrg;
}

/**
 * Invite join lockup: org mark → “Join {org}” → Powered by caluno.
 * Replaces caluno-first AuthBrand when a pending invite org is resolved.
 */
export async function AuthJoinHeader({ org }: AuthJoinHeaderProps) {
  const t = await getTranslations('Auth');

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <OrgMark name={org.name} logoUrl={org.logoUrl} />
      <h1 className="page-title text-balance">
        {t('joinTitle', { orgName: org.name })}
      </h1>
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-sm text-muted-foreground">{t('poweredBy')}</span>
        <AuthBrand className="text-base" />
      </div>
    </div>
  );
}

function OrgMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        className="size-14 shrink-0 rounded-xl object-contain"
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'flex size-14 shrink-0 items-center justify-center rounded-xl',
        'bg-muted text-xl font-semibold text-primary',
      )}
    >
      {getInitials(name)}
    </div>
  );
}
