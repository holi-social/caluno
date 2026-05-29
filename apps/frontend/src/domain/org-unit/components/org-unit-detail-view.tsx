'use client';

import type {
  GetOrganizationUnitQuery,
  OrganizationUnitType,
} from '@repo/data';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  BuildingIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
} from 'lucide-react';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { getDynamicIcon } from '@/lib/dynamic-icon';
import { FORM_ID, OrgUnitCreateEditSheet } from './org-unit-create-edit-sheet';

type OrganizationUnit = NonNullable<
  GetOrganizationUnitQuery['organizationUnit']
>;

interface OrgUnitDetailViewProps {
  orgUnit: OrganizationUnit;
  types: OrganizationUnitType[];
  canEdit: boolean;
}

export function OrgUnitDetailView({
  orgUnit,
  types,
  canEdit,
}: OrgUnitDetailViewProps) {
  const { open } = useSheetTrigger(FORM_ID);
  const TypeIcon = getDynamicIcon(orgUnit.type.icon, BuildingIcon);

  const hasContact =
    orgUnit.email || orgUnit.phone || orgUnit.websiteUrl || orgUnit.address;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-muted shrink-0">
            {orgUnit.logoUrl ? (
              <img
                src={orgUnit.logoUrl}
                alt={orgUnit.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <TypeIcon className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="page-title">{orgUnit.name}</h1>
            <Badge variant="secondary">{orgUnit.type.name}</Badge>
          </div>
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => open({ id: orgUnit.id })}
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {orgUnit.description && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {orgUnit.description}
            </p>
          </CardContent>
        </Card>
      )}

      {hasContact && (
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orgUnit.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${orgUnit.email}`} className="hover:underline">
                  {orgUnit.email}
                </a>
              </div>
            )}
            {orgUnit.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{orgUnit.phone}</span>
              </div>
            )}
            {orgUnit.websiteUrl && (
              <div className="flex items-center gap-2 text-sm">
                <GlobeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={orgUnit.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
                >
                  {orgUnit.websiteUrl}
                </a>
              </div>
            )}
            {orgUnit.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{orgUnit.address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {orgUnit.parent && (
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="text-muted-foreground">Part of </span>
              <span className="font-medium">{orgUnit.parent.name}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <OrgUnitCreateEditSheet types={types} />
    </>
  );
}
