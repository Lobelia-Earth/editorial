import type { MiddlewareHandler } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config, createEditorialDirectory } from "../__fixtures__/editorial.js";
import { createLocks } from "../lib/locks.js";
import { createStorage } from "../lib/storage.js";
import { createLockRoutes } from "./locks.js";

// The token is tested in auth.test.ts. Here the user comes from a test header.
vi.mock("../lib/middleware/auth.js", () => ({
  firebaseAuth: (): MiddlewareHandler => (c, next) => {
    const id = c.req.header("Test-User") ?? "alice";
    c.set("user", { id, name: id });
    return next();
  },
}));

describe("lock routes", () => {
  let editorial: Awaited<ReturnType<typeof createEditorialDirectory>>;
  let app: ReturnType<typeof createLockRoutes>;

  beforeEach(async () => {
    editorial = await createEditorialDirectory();
    app = createLockRoutes(
      config,
      createStorage(editorial.directory),
      createLocks(),
    );
  });

  afterEach(async () => {
    await editorial.remove();
  });

  const send = (
    method: string,
    path: string,
    { session, user }: { session?: string; user?: string } = {},
  ) =>
    app.request(path, {
      method,
      headers: {
        ...(session ? { "Editorial-Session": session } : {}),
        ...(user ? { "Test-User": user } : {}),
      },
    });

  it("locks an item and reports who holds it", async () => {
    const response = await send("POST", "/locks/tag/news", {
      session: "tab-a",
    });

    expect(response.status).toBe(200);
    const lock = await response.json();
    expect(lock).toMatchObject({
      type: "tag",
      id: "news",
      user: { id: "alice", name: "alice" },
    });

    const status = await send("GET", "/locks/tag/news");
    expect(await status.json()).toEqual(lock);
  });

  it("leaves out the lock of the session asking", async () => {
    await send("POST", "/locks/tag/news", { session: "tab-a" });

    const own = await send("GET", "/locks/tag/news", { session: "tab-a" });
    const other = await send("GET", "/locks/tag/news", { session: "tab-b" });

    expect(await own.json()).toBeNull();
    expect(await other.json()).toMatchObject({ user: { id: "alice" } });
  });

  it("returns null for an item nobody is editing", async () => {
    const response = await send("GET", "/locks/tag/news");

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  it("returns 423 with the holder when another session has the lock", async () => {
    await send("POST", "/locks/tag/news", { session: "tab-a" });

    const response = await send("POST", "/locks/tag/news", {
      session: "tab-b",
      user: "bob",
    });

    expect(response.status).toBe(423);
    expect(await response.json()).toMatchObject({
      lock: { user: { id: "alice" } },
    });
  });

  it("returns 404 for a missing item", async () => {
    const response = await send("POST", "/locks/tag/missing", {
      session: "tab-a",
    });

    expect(response.status).toBe(404);
  });

  it("requires a session to lock or release", async () => {
    expect((await send("POST", "/locks/tag/news")).status).toBe(400);
    expect((await send("DELETE", "/locks/tag/news")).status).toBe(400);
  });

  it("releases the lock only for the session holding it", async () => {
    await send("POST", "/locks/tag/news", { session: "tab-a" });

    await send("DELETE", "/locks/tag/news", { session: "tab-b" });
    expect(await (await send("GET", "/locks/tag/news")).json()).not.toBeNull();

    const response = await send("DELETE", "/locks/tag/news", {
      session: "tab-a",
    });
    expect(response.status).toBe(200);
    expect(await (await send("GET", "/locks/tag/news")).json()).toBeNull();
  });
});
