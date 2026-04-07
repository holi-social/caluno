import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@repo/ui";
import { Users } from "lucide-react";
import { ButtonClipboard } from "@/components/button-clipboard";

type EmptyVolunteersProps = {
  orgUnitUrl: string
}

export const EmptyVolunteers = ({orgUnitUrl}: EmptyVolunteersProps) =>
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
      <ButtonClipboard
        text="Copy invite link"
        copyText={orgUnitUrl}
        toastMessage="Invite link copied to clipboard"
      />
    </EmptyContent>
  </Empty>
