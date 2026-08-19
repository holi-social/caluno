import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_URL } from './constants';

export async function getSession() {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: {
        cookie: cookieHeader,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const session = await response.json();
    return session;
  } catch {
    return null;
  }
}

export async function requireAuth(redirectTo: string = '/signup') {
  const session = await getSession();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
