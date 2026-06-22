import { redirect } from 'next/navigation';
import HomePage from '@/domain/home/components/home-page';
import { resolvePostAuthDestination } from '@/lib/post-auth-routing';

export default async function Home() {
  const destination = await resolvePostAuthDestination();

  if (destination !== '/') {
    redirect(destination);
  }

  return <HomePage />;
}
