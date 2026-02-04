import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { SignupForm } from './signup-form';

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create your account</h2>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}
