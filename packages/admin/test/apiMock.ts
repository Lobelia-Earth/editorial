import type {
  EditorialDataItem,
  EditorialLock,
} from "@isardsat/editorial-common";
import { vi } from "vitest";

export const lockOf = (
  user: { id: string; name: string },
  lockedAt = "2026-01-01T10:00:00.000Z",
): EditorialLock => ({
  type: "page",
  id: "home",
  user,
  lockedAt,
  lastActiveAt: lockedAt,
  expiresAt: "2026-01-01T10:05:00.000Z",
});

type Handler = (request: Request) => Response | Promise<Response> | undefined;

/**
 * Stubs fetch with a fake Editorial API for a form editing `item`. Nobody else
 * is editing, so locking succeeds, and writes echo their body back as the
 * saved item. `handle` can answer any request first.
 */
export function stubApi(
  item: EditorialDataItem,
  handle: Handler = () => undefined,
) {
  const fetchMock = vi.fn(async (request: Request) => {
    const handled = await handle(request);
    if (handled) return handled;

    const { pathname } = new URL(request.url);
    if (pathname.includes("/locks/")) {
      if (request.method === "GET") return Response.json(null);
      if (request.method === "POST") {
        return Response.json(lockOf({ id: "me", name: "Me" }));
      }
      return Response.json(true);
    }
    if (request.method === "GET") return Response.json(item);
    return Response.json(await request.clone().json());
  });
  vi.stubGlobal("fetch", fetchMock);

  const requests = () => fetchMock.mock.calls.map(([request]) => request);

  return {
    fetchMock,
    /** Requests to the lock routes, as "METHOD /path" */
    lockRequests: () =>
      requests()
        .filter((request) => request.url.includes("/locks/"))
        .map((request) => `${request.method} ${new URL(request.url).pathname}`),
    /** Requests that change content */
    writes: () =>
      requests().filter(
        (request) =>
          request.method !== "GET" && !request.url.includes("/locks/"),
      ),
  };
}
