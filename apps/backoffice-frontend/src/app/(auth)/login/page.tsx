import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in</h2>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
