import { useAppDispatch } from "@/lib/store/hooks";
import {
  editorialApi,
  releaseLockOnUnload,
  useGetLockQuery,
  useLazyGetCurrentDataObjectQuery,
  useLockItemMutation,
  useUnlockItemMutation,
} from "@/lib/store/slices/editorialApi";
import type { EditorialLock } from "@isardsat/editorial-common";
import { useCallback, useEffect, useRef, useState } from "react";

/** Activity renews the lock at most this often. It expires after 5 minutes. */
export const RENEW_INTERVAL = 30 * 1000;
/** How often to check whether someone else is editing */
export const POLL_INTERVAL = 10 * 1000;

export type ItemLockState =
  /** This tab doesn't hold the lock. `lockedBy` says if another tab does. */
  | { status: "free" }
  | { status: "holding" }
  /** This tab's changes can't be saved: it lost the lock or the item changed */
  | { status: "outdated"; lock: EditorialLock | null };

export const isLockedError = (
  error: unknown,
): error is { status: 423; data: { lock: EditorialLock } } =>
  (error as { status?: unknown } | null)?.status === 423;

interface UseItemLockOptions {
  itemType: string;
  /** Missing for items that aren't created yet, which aren't locked */
  id: string | undefined;
  /** When the loaded item was last saved, to notice newer saves */
  updatedAt: string | undefined;
  isDirty: boolean;
  /** The first change is rejected because someone else is editing */
  onLockedOut: () => void;
  /** Someone saved since the item was loaded, so it is reloaded */
  onReloaded: () => void;
}

/**
 * Locks the item at the first change, so only one tab edits it at a time.
 * Activity keeps the lock, and saving or leaving releases it.
 */
export function useItemLock({
  itemType,
  id,
  updatedAt,
  isDirty,
  onLockedOut,
  onReloaded,
}: UseItemLockOptions) {
  const dispatch = useAppDispatch();
  const [lockItem] = useLockItemMutation();
  const [unlockItem] = useUnlockItemMutation();
  const [getCurrentItem] = useLazyGetCurrentDataObjectQuery();
  const [state, setState] = useState<ItemLockState>({ status: "free" });

  const lockedAt = useRef<string | null>(null);
  const isClaiming = useRef(false);
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const callbacks = useRef({ onLockedOut, onReloaded });
  useEffect(() => {
    callbacks.current = { onLockedOut, onReloaded };
  });

  const enabled = id !== undefined;
  const args = { itemType, id: id ?? "" };

  const { data: otherLock = null } = useGetLockQuery(args, {
    skip: !enabled || state.status !== "free",
    pollingInterval: POLL_INTERVAL,
  });

  // Saving remounts the form, which loads the item again
  const reload = useCallback(() => {
    dispatch(
      editorialApi.util.invalidateTags([
        { type: "data", id: `${itemType}-${id}` },
      ]),
    );
  }, [dispatch, itemType, id]);

  const changedSinceLoaded = useCallback(async () => {
    const current = await getCurrentItem({ itemType, id: id ?? "" }).unwrap();
    return current.updatedAt !== updatedAt;
  }, [getCurrentItem, itemType, id, updatedAt]);

  // Reload once the other tab is done, as it may have saved
  const hadOtherLock = useRef(false);
  useEffect(() => {
    if (otherLock) {
      hadOtherLock.current = true;
    } else if (hadOtherLock.current && !isDirty) {
      hadOtherLock.current = false;
      reload();
    }
  }, [otherLock, isDirty, reload]);

  // Lock at the first change
  useEffect(() => {
    if (!enabled || !isDirty || state.status !== "free" || isClaiming.current) {
      return;
    }
    isClaiming.current = true;

    (async () => {
      try {
        const lock = await lockItem(args).unwrap();
        lockedAt.current = lock.lockedAt;

        // Saving right after the first change can remount the form first
        if (!isMounted.current) {
          unlockItem(args);
          return;
        }
        if (await changedSinceLoaded()) {
          unlockItem(args);
          reload();
          callbacks.current.onReloaded();
          return;
        }
        setState({ status: "holding" });
      } catch (error) {
        if (isLockedError(error)) {
          dispatch(
            editorialApi.util.upsertQueryData("getLock", args, error.data.lock),
          );
          callbacks.current.onLockedOut();
        } else {
          // The form stays unlocked, and saving reports the error
          console.error(error);
        }
      } finally {
        isClaiming.current = false;
      }
    })();
  }, [enabled, isDirty, state.status]);

  // Renew on activity. The server expires the lock of an inactive tab.
  useEffect(() => {
    if (state.status !== "holding") return;

    let lastRenewal = Date.now();
    const renew = async () => {
      if (Date.now() - lastRenewal < RENEW_INTERVAL) return;
      lastRenewal = Date.now();

      try {
        const lock = await lockItem(args).unwrap();
        if (lock.lockedAt === lockedAt.current) return;

        // The lock expired while this tab was inactive, and someone may have
        // saved before it was taken again
        lockedAt.current = lock.lockedAt;
        if (await changedSinceLoaded()) {
          setState({ status: "outdated", lock: null });
        }
      } catch (error) {
        if (isLockedError(error)) {
          setState({ status: "outdated", lock: error.data.lock });
        }
      }
    };

    window.addEventListener("keydown", renew);
    window.addEventListener("pointerdown", renew);
    return () => {
      window.removeEventListener("keydown", renew);
      window.removeEventListener("pointerdown", renew);
    };
  }, [state.status, itemType, id, changedSinceLoaded]);

  // Release when leaving the page, saving (which remounts the form) or losing
  // the lock
  useEffect(() => {
    if (state.status !== "holding" || id === undefined) return;

    const onPageHide = () => releaseLockOnUnload(itemType, id);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      unlockItem({ itemType, id });
    };
  }, [state.status, itemType, id, unlockItem]);

  /** Saving was rejected because another tab took the lock */
  const markOutdated = useCallback((lock: EditorialLock | null) => {
    setState({ status: "outdated", lock });
  }, []);

  return {
    state,
    /** Who else is editing, if anyone */
    lockedBy:
      state.status === "free"
        ? otherLock
        : state.status === "outdated"
          ? state.lock
          : null,
    /** Someone else is editing, so the form can't be changed */
    isReadOnly: state.status === "free" && otherLock !== null,
    markOutdated,
    reload,
  };
}
