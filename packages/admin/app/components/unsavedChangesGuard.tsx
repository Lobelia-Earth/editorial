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
import { useEffect, useState } from "react";
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
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirmNavigation = () => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const handleCancelNavigation = () => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  useEffect(() => {
    setShowConfirmDialog(blocker.state === "blocked" ? true : false);
  }, [blocker.state, showConfirmDialog]);

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
