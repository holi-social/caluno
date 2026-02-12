type ShiftPageProps = {
  params: Promise<{ shiftId: string }>;
};

export default async function ShiftPage({ params }: ShiftPageProps) {
  const shiftId = (await params).shiftId;
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{shiftId}</h1>
      </div>
    </div>
  );
}
