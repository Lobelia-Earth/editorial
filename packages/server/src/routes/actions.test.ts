import type { MiddlewareHandler } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config, createEditorialDirectory } from "../__fixtures__/editorial.js";
import { createContent, item } from "../__fixtures__/schema.js";
import type { Hooks } from "../lib/hooks.js";
import { createStorage } from "../lib/storage.js";
import { createActionRoutes } from "./actions.js";
import { createDataRoutes } from "./data.js";

// Actions require a Firebase token, which is tested in auth.test.ts
vi.mock("../lib/middleware/auth.js", () => ({
  firebaseAuth: (): MiddlewareHandler => (_, next) => next(),
}));

describe("POST /publish", () => {
  let editorial: Awaited<ReturnType<typeof createEditorialDirectory>>;
  let storage: ReturnType<typeof createStorage>;
  let hooks: { [K in keyof Hooks]: ReturnType<typeof vi.fn> };
  let app: ReturnType<typeof createActionRoutes>;

  beforeEach(async () => {
    const preview = createContent();
    preview.article.hello = { ...preview.article.hello, title: "Hello again" };
    preview.article.wip = item("wip", { title: "Draft", isDraft: true });

    editorial = await createEditorialDirectory({ preview });
    storage = createStorage(editorial.directory);
    hooks = {
      onLocalize: vi.fn(),
      onLocalizeEnd: vi.fn(),
      onPublish: vi.fn(),
      onPull: vi.fn(),
      onPush: vi.fn(),
    };
    app = createActionRoutes(config, storage, hooks as unknown as Hooks);
  });

  afterEach(async () => {
    await editorial.remove();
    vi.restoreAllMocks();
  });

  const publish = async () => {
    const response = await app.request("/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "ada@example.com" }),
    });
    return { status: response.status, body: await response.json() };
  };

  it("copies preview content without drafts to production", async () => {
    const preview = await editorial.readData();

    expect(await publish()).toEqual({ status: 200, body: true });

    const { wip, ...published } = preview.article;
    expect(wip.isDraft).toBe(true);
    expect(await editorial.readData("data.prod.json")).toEqual({
      ...preview,
      article: published,
    });
    expect(await editorial.readData()).toEqual(preview);
  });

  it("runs the localize, publish and push hooks in order", async () => {
    await publish();

    const production = await editorial.readData("data.prod.json");
    const schema = await storage.getSchema();
    expect(hooks.onLocalize).toHaveBeenCalledWith(production, schema);
    expect(hooks.onPublish).toHaveBeenCalledWith(production, schema);
    expect(hooks.onPush).toHaveBeenCalledWith("ada@example.com");
    expect(hooks.onLocalize.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onPublish.mock.invocationCallOrder[0],
    );
    expect(hooks.onPublish.mock.invocationCallOrder[0]).toBeLessThan(
      hooks.onPush.mock.invocationCallOrder[0],
    );
  });

  it("returns false and skips later hooks when a hook fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    hooks.onPublish.mockRejectedValue(new Error("Build failed"));

    expect(await publish()).toEqual({ status: 200, body: false });
    expect(hooks.onPush).not.toHaveBeenCalled();
  });

  it("leaves no unpublished changes", async () => {
    const dataApp = createDataRoutes(config, storage);

    await publish();

    const response = await dataApp.request("/environments/diff");
    expect(await response.json()).toEqual({ collections: {}, singles: {} });
  });
});
