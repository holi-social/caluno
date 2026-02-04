import { getDataClient } from '@/lib/data-client';

export default async function ProjectsPage() {
  const data = await getDataClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>
    </div>
  );
}
