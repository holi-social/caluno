'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@repo/ui';

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout} disabled={loading}>
      {loading ? 'Signing out…' : 'Log out'}
    </Button>
  );
}
