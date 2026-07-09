import { redirect } from 'next/navigation';
import HomePage from '@/domain/home/components/home-page';
import { resolveAdminDestination } from '@/lib/routing';

export default async function Home() {
  const destination = await resolveAdminDestination();

  if (destination) {
    redirect(destination);
  }

  return <HomePage />;
}
