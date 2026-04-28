import { redirect } from 'next/navigation';
import { getFormConfig } from '@/lib/store-configs';
import { FormSuccessScreen } from '@/components/form-success-screen';

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getFormConfig(slug);

  if (!config) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <FormSuccessScreen settings={config.settings} />
    </div>
  );
}
