import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@repo/ui";
import { Users } from "lucide-react";
import { PropsWithChildren } from "react";


export const EmptyShifts = ({ children }: PropsWithChildren) =>
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Users />
      </EmptyMedia>
      <EmptyTitle>No shifts yet</EmptyTitle>
      <EmptyDescription>
        Get started by creating your first shift and inviting volunteers.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      { children }
    </EmptyContent>
  </Empty>
