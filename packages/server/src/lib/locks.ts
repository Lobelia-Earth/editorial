import type { EditorialLock } from "@isardsat/editorial-common";
import type { AuthUser } from "./middleware/auth.js";

/** A lock expires when its holder hasn't renewed it for this long */
export const LOCK_DURATION = 5 * 60 * 1000;

interface StoredLock {
  session: string;
  user: AuthUser;
  lockedAt: number;
  lastActiveAt: number;
}

export type AcquireResult =
  | { acquired: true; lock: EditorialLock }
  | { acquired: false; lock: EditorialLock };

/**
 * Keeps which browser tab is editing each item. Locks live in memory, so they
 * assume one server process per data directory, and a restart drops them.
 */
export function createLocks({
  duration = LOCK_DURATION,
  now = () => Date.now(),
}: { duration?: number; now?: () => number } = {}) {
  const locks = new Map<string, StoredLock>();

  const keyOf = (type: string, id: string) => JSON.stringify([type, id]);

  function getStored(type: string, id: string) {
    const key = keyOf(type, id);
    const lock = locks.get(key);

    if (lock && now() - lock.lastActiveAt >= duration) {
      locks.delete(key);
      return undefined;
    }
    return lock;
  }

  // The session stays private, so nobody can write as the lock holder
  function toPublic(type: string, id: string, lock: StoredLock): EditorialLock {
    return {
      type,
      id,
      user: lock.user,
      lockedAt: new Date(lock.lockedAt).toISOString(),
      lastActiveAt: new Date(lock.lastActiveAt).toISOString(),
      expiresAt: new Date(lock.lastActiveAt + duration).toISOString(),
    };
  }

  return {
    get(type: string, id: string): EditorialLock | null {
      const lock = getStored(type, id);
      return lock ? toPublic(type, id, lock) : null;
    },

    /** Takes the lock, or renews it if the session already holds it */
    acquire(
      type: string,
      id: string,
      session: string,
      user: AuthUser,
    ): AcquireResult {
      const current = getStored(type, id);

      if (current && current.session !== session) {
        return { acquired: false, lock: toPublic(type, id, current) };
      }

      const lock: StoredLock = {
        session,
        user,
        lockedAt: current?.lockedAt ?? now(),
        lastActiveAt: now(),
      };
      locks.set(keyOf(type, id), lock);

      return { acquired: true, lock: toPublic(type, id, lock) };
    },

    /** Releases the lock if the session holds it */
    release(type: string, id: string, session: string) {
      if (getStored(type, id)?.session === session) {
        locks.delete(keyOf(type, id));
      }
    },

    /**
     * Returns the lock if a session other than this one holds it. Writes
     * without a session come from API clients, which don't take locks, so
     * they are never blocked.
     */
    heldByOther(type: string, id: string, session: string | undefined) {
      if (!session) return null;

      const lock = getStored(type, id);
      return lock && lock.session !== session ? toPublic(type, id, lock) : null;
    },

    /** Keeps the lock on an item when it is renamed */
    move(type: string, oldId: string, newId: string) {
      const lock = getStored(type, oldId);
      if (!lock) return;

      locks.delete(keyOf(type, oldId));
      locks.set(keyOf(type, newId), lock);
    },

    remove(type: string, id: string) {
      locks.delete(keyOf(type, id));
    },
  };
}

export type Locks = ReturnType<typeof createLocks>;
