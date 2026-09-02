import type { ReactNode } from 'react';
import type { PendingInviteOrg } from '@/lib/pending-invite-org';
import { AuthBrand } from './auth-brand';
import { AuthJoinHeader } from './auth-join-header';

interface AuthPageShellProps {
  title: string;
  /** Shown under the title when not in invite/join context. */
  description?: string;
  /** When set, replaces brand + title with the invite join lockup. */
  joiningOrg?: PendingInviteOrg | null;
  children: ReactNode;
}

/**
 * Auth layout header:
 * - Join state: org mark → Join {org} → Powered by caluno
 * - Default: caluno wordmark → page title → description
 */
export function AuthPageShell({
  title,
  description,
  joiningOrg,
  children,
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-10 md:py-16">
      <div className="flex w-full max-w-md flex-col gap-8">
        {joiningOrg ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <AuthJoinHeader org={joiningOrg} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 text-center">
            <AuthBrand />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {description ? (
                <p className="text-sm text-muted-foreground text-pretty">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
