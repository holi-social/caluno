import { cn } from '@repo/ui/utils';
import { getTranslations } from 'next-intl/server';

interface AuthBrandProps {
  className?: string;
}

/** Caluno wordmark for auth pages — Geologica + primary, no SVG lockup. */
export async function AuthBrand({ className }: AuthBrandProps) {
  const t = await getTranslations('Auth');

  return (
    <span
      className={cn(
        'font-sans text-4xl font-bold tracking-tight text-primary',
        className,
      )}
    >
      {t('brandName')}
    </span>
  );
}
