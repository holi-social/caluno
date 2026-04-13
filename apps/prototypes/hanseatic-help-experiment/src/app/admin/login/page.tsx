'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardContent, Input, Label } from '@repo/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Sign-in failed');
        return;
      }
      router.push('/admin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex justify-center items-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h1 className="text-xl font-medium mb-4">Admin</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Use the credentials from your environment variables.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-user">Username</Label>
              <Input
                id="admin-user"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-pass">Password</Label>
              <Input
                id="admin-pass"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
