import { Button } from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { localeLabel } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';

type AccountSectionProps = {
  locale: string;
  emailWeeklyUpdateEnabled: boolean;
  emailUrgentCallsEnabled: boolean;
  emailPlatformEnabled: boolean;
};

export const AccountSection = async ({
  locale,
  emailWeeklyUpdateEnabled,
  emailUrgentCallsEnabled,
  emailPlatformEnabled,
}: AccountSectionProps) => {
  const tProfile = await getTranslations('Profile');
  const tCommon = await getTranslations('Common');

  const emailSettings = [
    {
      label: tProfile('emailWeeklyUpdate'),
      description: tProfile('emailWeeklyUpdateDescription'),
      enabled: emailWeeklyUpdateEnabled,
    },
    {
      label: tProfile('emailUrgentCalls'),
      description: tProfile('emailUrgentCallsDescription'),
      enabled: emailUrgentCallsEnabled,
    },
    {
      label: tProfile('emailPlatform'),
      description: tProfile('emailPlatformDescription'),
      enabled: emailPlatformEnabled,
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{tProfile('accountSettings')}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/account-settings">
            <Pencil className="size-4" />
            {tCommon('edit')}
          </Link>
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base">{tProfile('language')}</h2>
            <span className="text-sm">{localeLabel(locale)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {tProfile('languageDescription')}
          </p>
        </div>

        <div className="space-y-1">
          <h2 className="text-base">{tProfile('emailSettings')}</h2>
          <dl className="space-y-3">
            {emailSettings.map(({ label, description, enabled }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4"
              >
                <dt>
                  <span className="block text-sm">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {description}
                  </span>
                </dt>
                <dd className="text-sm">
                  {enabled ? tProfile('emailOn') : tProfile('emailOff')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};
