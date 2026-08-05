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
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{tProfile('accountSettings')}</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/account-settings">
            <Pencil className="size-4" />
            {tCommon('edit')}
          </Link>
        </Button>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {tProfile('language')}
        </p>
        <p className="text-xs text-muted-foreground">
          {tProfile('languageDescription')}
        </p>
        <p className="mt-1 text-base text-foreground">{localeLabel(locale)}</p>
      </div>
    </section>
  );
};
