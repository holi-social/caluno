'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { Building2, LogOut, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="from-background to-muted/30 flex min-h-screen flex-col bg-gradient-to-br">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Building2 className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="font-semibold">Clippy</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2"
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Manage your organizations and volunteers all in one place.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-1">
          <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                <Plus className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Create an Organization</CardTitle>
              <CardDescription>
                Set up a new organization to start managing your volunteers and
                shifts.
              </CardDescription>
            </CardHeader>
            <CardContent />
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/create-organization')}
              >
                Get started
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
