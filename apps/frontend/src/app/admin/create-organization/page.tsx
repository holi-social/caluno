import { CreateOrganizationForm } from './create-organization-form';

export default async function CreateOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create an organization</h2>
        </div>

        <CreateOrganizationForm />
      </div>
    </div>
  );
}
