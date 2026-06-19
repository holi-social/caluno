import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('unauthorizedTitle'),
  };
}

interface UnauthorizedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string }>;
}

export default async function UnauthorizedPage({
  params,
  searchParams,
}: UnauthorizedPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Unauthorized');
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {message ? (
          <p className="text-muted-foreground">{message}</p>
        ) : (
          <p className="text-muted-foreground">{t('message')}</p>
        )}
        <Link href="/" className="text-primary hover:underline">
          {t('homeLink')}
        </Link>
      </div>
    </div>
  );
}
