import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { firebaseAuth, getTokenUser } from "./auth.js";

const createApp = () => {
  const handler = vi.fn(() => new Response("ok"));
  const app = new Hono();
  app.get("/", firebaseAuth("test-project"), handler);
  return { app, handler };
};

describe("firebaseAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ["no header", undefined],
    ["a non-bearer header", "Basic dXNlcjpwYXNz"],
  ])("rejects requests with %s", async (_, authorization) => {
    const { app, handler } = createApp();

    const response = await app.request("/", {
      headers: authorization ? { Authorization: authorization } : {},
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized: Missing or invalid authorization header",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects malformed tokens", async () => {
    // Malformed tokens fail before the Google keys are fetched
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { app, handler } = createApp();

    const response = await app.request("/", {
      headers: { Authorization: "Bearer not-a-jwt" },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized: Invalid token",
    });
    expect(handler).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("getTokenUser", () => {
  it("uses the name, then the email, of the token", () => {
    expect(
      getTokenUser({ sub: "u1", name: "Ada", email: "ada@example.com" }),
    ).toEqual({ id: "u1", name: "Ada" });
    expect(getTokenUser({ sub: "u1", email: "ada@example.com" })).toEqual({
      id: "u1",
      name: "ada@example.com",
    });
    expect(getTokenUser({ sub: "u1" })).toEqual({ id: "u1", name: null });
  });
});
