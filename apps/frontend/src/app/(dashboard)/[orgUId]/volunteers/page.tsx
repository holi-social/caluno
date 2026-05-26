import ManageVolunteersClient from './manage-volunteers-client';

interface Props {
  params: Promise<{ orgUId: string }>;
}

export default async function VolunteersPage({ params }: Props) {
  const { orgUId } = await params;

  return <ManageVolunteersClient orgUId={orgUId} />;
}
