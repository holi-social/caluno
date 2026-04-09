import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@repo/ui";
import { Users } from "lucide-react";
import { PropsWithChildren } from "react";

export const EmptyVolunteers = ({ children }: PropsWithChildren) =>
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Users />
      </EmptyMedia>
      <EmptyTitle>No volunteers yet</EmptyTitle>
      <EmptyDescription>
        Share the invitation link to get volunteers to sign-up.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      { children }
    </EmptyContent>
  </Empty>
