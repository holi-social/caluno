'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Requirement {
  id: string;
  name: string;
  description?: string | null;
  mandatory: boolean;
}

interface RequirementStatus {
  requirementId: string;
  name: string;
  status: string;
}

interface OrgRequirementsProps {
  orgName: string;
  profileName?: string | null;
  profileDescription?: string | null;
  requirements: Requirement[];
  requirementStatuses: RequirementStatus[];
}

function getStatusIcon(status: string) {
  if (status === 'APPROVED') {
    return <CheckCircle2 className="size-5 text-green-500" />;
  }
  if (status === 'REJECTED') {
    return <XCircle className="size-5 text-red-500" />;
  }
  return <Circle className="size-5 text-amber-500" />;
}

export function OrgRequirementsNeeded({
  orgName,
  profileName,
  profileDescription,
  requirements,
  requirementStatuses,
}: OrgRequirementsProps) {
  const statusMap = new Map(
    requirementStatuses.map((s) => [s.requirementId, s.status]),
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join {orgName}</CardTitle>
          <p className="text-muted-foreground">
            Before you can join this organization, you need to complete the
            following requirements.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(profileName || profileDescription) && (
            <div className="rounded-lg bg-muted p-4">
              {profileName && <h3 className="font-semibold">{profileName}</h3>}
              {profileDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profileDescription}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {requirements.map((req) => {
              const status = statusMap.get(req.id) ?? 'PENDING';
              return (
                <div
                  key={req.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  {getStatusIcon(status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{req.name}</span>
                      {req.mandatory && (
                        <span className="text-xs text-red-500 font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {req.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground capitalize mt-1 block">
                      Status: {status.toLowerCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
