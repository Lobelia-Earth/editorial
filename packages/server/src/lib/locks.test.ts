import { beforeEach, describe, expect, it } from "vitest";
import { createLocks, type Locks } from "./locks.js";

const DURATION = 1000;
const alice = { id: "alice", name: "Alice" };
const bob = { id: "bob", name: "Bob" };

describe("locks", () => {
  let time: number;
  let locks: Locks;

  beforeEach(() => {
    time = Date.parse("2026-01-01T10:00:00.000Z");
    locks = createLocks({ duration: DURATION, now: () => time });
  });

  it("locks a free item for the session", () => {
    const result = locks.acquire("tag", "news", "tab-a", alice);

    expect(result).toEqual({
      acquired: true,
      lock: {
        type: "tag",
        id: "news",
        user: alice,
        lockedAt: "2026-01-01T10:00:00.000Z",
        lastActiveAt: "2026-01-01T10:00:00.000Z",
        expiresAt: "2026-01-01T10:00:01.000Z",
      },
    });
    expect(locks.get("tag", "news")).toEqual(result.lock);
    expect(locks.get("tag", "tech")).toBeNull();
  });

  it("renews the lock for the session holding it", () => {
    locks.acquire("tag", "news", "tab-a", alice);
    time += 600;

    const { lock } = locks.acquire("tag", "news", "tab-a", alice);

    expect(lock.lockedAt).toBe("2026-01-01T10:00:00.000Z");
    expect(lock.lastActiveAt).toBe("2026-01-01T10:00:00.600Z");
    expect(lock.expiresAt).toBe("2026-01-01T10:00:01.600Z");
  });

  it("keeps other sessions out, including the same user in another tab", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    const other = locks.acquire("tag", "news", "tab-b", bob);
    const sameUser = locks.acquire("tag", "news", "tab-c", alice);

    expect(other).toMatchObject({ acquired: false, lock: { user: alice } });
    expect(sameUser.acquired).toBe(false);
  });

  it("expires a lock that isn't renewed", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    time += DURATION - 1;
    expect(locks.get("tag", "news")).not.toBeNull();

    time += 1;
    expect(locks.get("tag", "news")).toBeNull();
    expect(locks.acquire("tag", "news", "tab-b", bob)).toMatchObject({
      acquired: true,
      lock: { user: bob, lockedAt: "2026-01-01T10:00:01.000Z" },
    });
  });

  it("releases the lock only for the session holding it", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    locks.release("tag", "news", "tab-b");
    expect(locks.get("tag", "news")).not.toBeNull();

    locks.release("tag", "news", "tab-a");
    expect(locks.get("tag", "news")).toBeNull();
  });

  it("reports the lock only to other sessions", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    expect(locks.heldByOther("tag", "news", "tab-a")).toBeNull();
    expect(locks.heldByOther("tag", "news", "tab-b")).toMatchObject({
      user: alice,
    });
    expect(locks.heldByOther("tag", "news", undefined)).toBeNull();
    expect(locks.heldByOther("tag", "tech", "tab-b")).toBeNull();
  });

  it("never exposes the session", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    expect(JSON.stringify(locks.get("tag", "news"))).not.toContain("tab-a");
  });

  it("moves the lock when the item is renamed", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    locks.move("tag", "news", "breaking");

    expect(locks.get("tag", "news")).toBeNull();
    expect(locks.heldByOther("tag", "breaking", "tab-b")).toMatchObject({
      id: "breaking",
      user: alice,
    });
  });

  it("removes the lock of a deleted item", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    locks.remove("tag", "news");

    expect(locks.get("tag", "news")).toBeNull();
  });

  it("keeps items of different types apart", () => {
    locks.acquire("tag", "news", "tab-a", alice);

    expect(locks.get("author", "news")).toBeNull();
  });
});
