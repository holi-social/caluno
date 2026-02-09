export default async function ShiftsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">
            Manage and view your organization&apos;s shifts
          </p>
        </div>
      </div>

      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No shifts yet. Create your first shift to get started.
        </p>
      </div>
    </>
  );
}
