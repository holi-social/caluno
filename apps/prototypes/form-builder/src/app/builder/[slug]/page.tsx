import { redirect } from 'next/navigation';
import { getFormConfig } from '@/lib/store-configs';
import { BuilderLayout } from '@/components/builder/builder-layout';

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getFormConfig(slug);

  if (!config) {
    redirect('/');
  }

  return <BuilderLayout initialConfig={config} />;
}
