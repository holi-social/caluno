import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFormConfig } from '@/lib/store-configs';
import { listBlocks } from '@/lib/store-blocks';
import { getCurrentUserFromCookieValue, USER_COOKIE } from '@/lib/users';
import { BuilderLayout } from '@/components/v1/builder/builder-layout';

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const currentUser = getCurrentUserFromCookieValue(
    cookieStore.get(USER_COOKIE)?.value,
  );

  const [config, allBlocks] = await Promise.all([
    getFormConfig(slug),
    listBlocks(),
  ]);

  if (!config) {
    redirect('/v1');
  }

  return (
    <BuilderLayout
      initialConfig={config}
      initialBlocks={allBlocks}
      currentUser={currentUser}
    />
  );
}
