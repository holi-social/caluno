'use client';

import {
  useApproveVolunteerSession,
  useRejectVolunteerSession,
} from '@repo/data/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Textarea,
} from '@repo/ui';
import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TimesheetActionButtonsProps {
  sessionId: string;
  organizationId: string;
}

export function TimesheetActionButtons({
  sessionId,
  organizationId,
}: TimesheetActionButtonsProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const approveMutation = useApproveVolunteerSession();
  const rejectMutation = useRejectVolunteerSession();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: sessionId,
        organizationId,
      });
      toast.success('Timesheet approved successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to approve timesheet');
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: sessionId,
        organizationId,
        rejectionReason,
      });
      toast.success('Timesheet rejected');
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to reject timesheet');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Approve Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={approveMutation.isPending}
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Timesheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this timesheet? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={rejectMutation.isPending}>
            <XIcon className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Timesheet</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this timesheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
