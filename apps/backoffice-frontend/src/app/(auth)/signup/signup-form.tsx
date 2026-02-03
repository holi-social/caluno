'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signUp } from '@/lib/auth';

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signUp.email({ name, email, password });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        setIsPending(false);
        return;
      }

      if (result.data?.user) {
        router.push('/');
      } else {
        setError('Signup failed. Please try again.');
        setIsPending(false);
      }
    } catch (error) {
      console.log(error);
      setError('Failed to create account. Please try again.');
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Full Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1"
            placeholder="John Doe"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1"
            placeholder="you@example.com"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1"
            placeholder="••••••••"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            At least 6 characters
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
