import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import type { EditorialLock } from "@isardsat/editorial-common";
import { Lock, RotateCcw, TriangleAlert } from "lucide-react";

interface ItemLockBannerProps {
  /** Who else is editing, if anyone */
  lockedBy: EditorialLock | null;
  /** This tab's changes can't be saved anymore */
  isOutdated: boolean;
  currentUserId?: string;
  onReload: () => void;
}

export default function ItemLockBanner({
  lockedBy,
  isOutdated,
  currentUserId,
  onReload,
}: ItemLockBannerProps) {
  const isYou = !!lockedBy && lockedBy.user.id === currentUserId;
  const name = lockedBy?.user.name ?? "Someone else";

  if (isOutdated) {
    const reason = !lockedBy
      ? "Someone else saved this item while you were inactive."
      : isYou
        ? "You started editing this item in another tab while this one was inactive."
        : `${name} started editing this item while you were inactive.`;

    return (
      <Alert variant="destructive" className="mb-4 max-w-[800px]">
        <TriangleAlert />
        <AlertTitle>Your changes can't be saved</AlertTitle>
        <AlertDescription>
          <p>
            {reason} Copy anything you want to keep, then reload to see the
            latest version.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onReload}
          >
            <RotateCcw />
            Reload
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!lockedBy) return null;

  return (
    <Alert className="mb-4 max-w-[800px]">
      <Lock />
      <AlertTitle>
        {isYou
          ? "You're editing this item in another tab"
          : `${name} is editing this item`}
      </AlertTitle>
      <AlertDescription>
        {isYou
          ? "Close it there, or edit it here once that tab has been inactive for 5 minutes."
          : `Last active ${formatTime(new Date(lockedBy.lastActiveAt), true)}. You can edit it when they're done, and it will reload with their changes.`}
      </AlertDescription>
    </Alert>
  );
}
