'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@repo/ui';
import { Loader2 } from 'lucide-react';
import type { Block, FormConfig } from '@/lib/types';
import { MultiStepForm } from '@/components/v1/form/multi-step-form';
import { FormSuccessScreen } from '@/components/v1/form-success-screen';

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEmbed = searchParams.get('embed') === 'true';

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [formRes, blocksRes] = await Promise.all([
          fetch(`/api/forms/${params.slug}`),
          fetch('/api/blocks'),
        ]);
        if (!formRes.ok) {
          setError('Formular nicht gefunden.');
          return;
        }
        const formData = (await formRes.json()) as FormConfig;
        const blocksData = blocksRes.ok
          ? ((await blocksRes.json()) as Block[])
          : [];
        setConfig(formData);
        setBlocks(blocksData);
      } catch {
        setError('Fehler beim Laden des Formulars.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {error || 'Formular nicht gefunden.'}
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={isEmbed ? 'p-4' : 'mx-auto max-w-lg px-4 py-12'}>
        <FormSuccessScreen
          settings={config.settings}
          onReset={() => {
            setSuccess(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className={isEmbed ? 'p-4' : 'min-h-screen bg-muted/30'}>
      {!isEmbed && (
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-lg px-4 py-4">
            <p className="text-muted-foreground text-sm">
              {config.organizationName}
            </p>
            <h1 className="text-lg font-bold">{config.name}</h1>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <MultiStepForm
              config={config}
              blocks={blocks}
              onSuccess={() => setSuccess(true)}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
