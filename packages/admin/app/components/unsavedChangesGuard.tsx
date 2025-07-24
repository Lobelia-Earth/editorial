import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useBlocker } from "react-router";

interface UnsavedChangesGuardProps {
  hasUnsavedChanges: boolean;
  title?: string;
  description?: string;
  stayButtonText?: string;
  leaveButtonText?: string;
}

export default function UnsavedChangesGuard({
  hasUnsavedChanges,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.",
  stayButtonText = "Stay on Page",
  leaveButtonText = "Leave Page",
}: UnsavedChangesGuardProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirmNavigation = () => {
    setShowConfirmDialog(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  if (blocker.state === "blocked" && !showConfirmDialog) {
    setShowConfirmDialog(true);
  }

  return (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelNavigation}>
            {stayButtonText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmNavigation}>
            {leaveButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}