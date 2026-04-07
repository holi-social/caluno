import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@repo/ui";
import { Users } from "lucide-react";
import { PropsWithChildren } from "react";


export const EmptyTimeEntries = ({ children }: PropsWithChildren) =>
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Users />
      </EmptyMedia>
      <EmptyTitle>No time entries</EmptyTitle>
      <EmptyDescription>
        You can check somebody into a Shift or manually add Time Entry.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      { children }
    </EmptyContent>
  </Empty>
