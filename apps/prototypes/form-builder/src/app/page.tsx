import { listFormConfigs } from '@/lib/store-configs';
import { CreateFormDialog } from '@/components/create-form-dialog';
import { FormCard } from '@/components/form-card';

export default async function DashboardPage() {
  const configs = await listFormConfigs();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Formular-Baukasten</h1>
            <p className="text-muted-foreground text-sm">
              Registrierungs- und Onboarding-Formulare verwalten
            </p>
          </div>
          <CreateFormDialog />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {configs.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            Noch keine Formulare. Erstellen Sie Ihr erstes Formular.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((config) => (
              <FormCard key={config.id} config={config} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
