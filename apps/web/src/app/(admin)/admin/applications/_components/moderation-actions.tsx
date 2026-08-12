'use client';

import { useState } from 'react';
import { Button } from '@khan-familia/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@khan-familia/ui';
import { Textarea } from '@khan-familia/ui';
import { toast } from 'sonner';
import { approveApplicationAction, rejectApplicationAction } from '../actions';

interface ModerationActionsProps {
  applicationId: string;
  currentStatus: string;
  onComplete: () => void;
}

export function ModerationActions({
  applicationId,
  currentStatus,
  onComplete,
}: ModerationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  if (currentStatus !== 'PENDING') {
    return (
      <div className="p-4 bg-muted text-center rounded-lg border text-sm text-muted-foreground">
        This application has already been {currentStatus.toLowerCase()}.
      </div>
    );
  }

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveApplicationAction(applicationId, 'Approved via Admin Console');
      toast.success('Application approved successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to approve application.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setIsLoading(true);
    try {
      await rejectApplicationAction(applicationId, notes);
      toast.success('Application rejected.');
      setRejectDialogOpen(false);
      onComplete();
    } catch (error) {
      toast.error('Failed to reject application.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={() => setRejectDialogOpen(true)}
          disabled={isLoading}
        >
          Reject
        </Button>
        <Button className="w-full" onClick={handleApprove} disabled={isLoading}>
          Approve Application
        </Button>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this vendor application. This will be recorded
              internally.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Invalid business registration document..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !notes.trim()}
            >
              {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
