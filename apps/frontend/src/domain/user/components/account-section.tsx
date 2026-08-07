import { Button } from '@repo/ui';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { localeLabel } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';

type AccountSectionProps = {
  locale: string;
};

export const AccountSection = async ({ locale }: AccountSectionProps) => {
  const tProfile = await getTranslations('Profile');
  const tCommon = await getTranslations('Common');

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

      <div className="space-y-1">
        <div>
          <h2 className="text-base">{tProfile('language')}</h2>
          <p className="text-xs text-muted-foreground">
            {tProfile('languageDescription')}
          </p>
        </div>
        <span className="text-sm">{localeLabel(locale)}</span>
      </div>
    </section>
  );
};
