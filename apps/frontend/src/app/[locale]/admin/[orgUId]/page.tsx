import { PermissionKey } from '@repo/data';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OrgUnitDetailView } from '@/domain/org-unit/components/org-unit-detail-view';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission } from '@/lib/permissions-server';

interface OrgUnitDetailPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function OrgUnitDetailPage({
  params,
}: OrgUnitDetailPageProps) {
  const { orgUId } = await params;
  await requireOrgAccess(orgUId);
  const data = await getDataClient({ orgUId });

  const [[canEdit = false], orgUnit, types] = await Promise.all([
    checkPermission(orgUId, PermissionKey.OrgEdit),
    data.organizationUnit.findById(orgUId),
    data.organizationUnit.findAllTypes(),
  ]);

  if (!orgUnit) notFound();

  return (
    <div className="space-y-6">
      {/* Suspense required: OrgUnitDetailView uses useSheetTrigger → useSearchParams */}
      <Suspense fallback={null}>
        <OrgUnitDetailView orgUnit={orgUnit} types={types} canEdit={canEdit} />
      </Suspense>
    </div>
  );
}
