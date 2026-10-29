import type { MiddlewareHandler } from "hono";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  config,
  createEditorialDirectory,
  FILES_URL,
} from "../__fixtures__/editorial.js";
import { createStorage } from "../lib/storage.js";
import { createDataRoutes } from "./data.js";

// Write routes require a Firebase token, which is tested in auth.test.ts
vi.mock("../lib/middleware/auth.js", () => ({
  firebaseAuth: (): MiddlewareHandler => (_, next) => next(),
}));

const PREVIEW_ORIGIN = "http://localhost";

let editorial: Awaited<ReturnType<typeof createEditorialDirectory>>;
let app: ReturnType<typeof createDataRoutes>;

beforeAll(async () => {
  editorial = await createEditorialDirectory();
  app = createDataRoutes(config, createStorage(editorial.directory));
});

afterAll(async () => {
  await editorial.remove();
});

// Response bodies are checked against the fixture, so they are left untyped
const getJson = async (path: string): Promise<any> => {
  const response = await app.request(path);
  expect(response.status).toBe(200);
  return response.json();
};

const expectedBlocks = (origin: string) => [
  { _block: "text", body: "Intro" },
  { _block: "image", file: `${origin}/images/a.png`, caption: "A" },
  { _block: "image", file: "https://cdn.example.com/b.png", caption: "B" },
  { _block: "quote", author: "ada", tags: ["tech", "missing"] },
  { _block: "video", file: "videos/v.mp4", author: "ada" },
];

describe("GET /data/:itemType", () => {
  it("returns file URLs inside blocks", async () => {
    const { hello } = await getJson("/data/article");

    expect(hello.cover).toBe(`${FILES_URL}/covers/hello.png`);
    expect(hello.author).toBe("bob");
    expect(hello.content).toEqual(expectedBlocks(FILES_URL));
  });

  it("uses the request origin for preview data", async () => {
    const { hello } = await getJson("/data/article?preview=true");

    expect(hello.content).toEqual(expectedBlocks(PREVIEW_ORIGIN));
  });

  it("resolves references and file URLs inside blocks with resolve", async () => {
    const { hello } = await getJson("/data/article?resolve=true");

    expect(hello.author.id).toBe("bob");
    expect(hello.author.mentor.avatar).toBe(`${FILES_URL}/authors/ada.png`);
    expect(hello.tags.map((tag: { id: string }) => tag.id)).toEqual([
      "news",
      "tech",
    ]);
    expect(hello.content[1].file).toBe(`${FILES_URL}/images/a.png`);
    expect(hello.content[3].author).toMatchObject({
      id: "ada",
      avatar: `${FILES_URL}/authors/ada.png`,
    });
    expect(hello.content[3].tags).toMatchObject([{ id: "tech" }]);
    expect(hello.content[4]).toEqual(expectedBlocks(FILES_URL)[4]);
  });

  it("returns 404 for unknown collections", async () => {
    const response = await app.request("/data/unknown");

    expect(response.status).toBe(404);
  });
});

describe("GET /data/:itemType/:id", () => {
  it("returns file URLs inside blocks", async () => {
    const hello = await getJson("/data/article/hello");

    expect(hello.cover).toBe(`${FILES_URL}/covers/hello.png`);
    expect(hello.author).toBe("bob");
    expect(hello.content).toEqual(expectedBlocks(FILES_URL));
  });

  it("resolves references and file URLs inside blocks with resolve", async () => {
    const hello = await getJson("/data/article/hello?resolve=true");

    expect(hello.author.id).toBe("bob");
    expect(hello.content[1].file).toBe(`${FILES_URL}/images/a.png`);
    expect(hello.content[3].author).toMatchObject({
      id: "ada",
      avatar: `${FILES_URL}/authors/ada.png`,
    });
    expect(hello.content[3].tags).toMatchObject([{ id: "tech" }]);
  });

  it("returns the same item on repeated requests", async () => {
    // The routes cache the content, so resolving must not mutate it
    const first = await getJson("/data/article/hello?resolve=true");
    const second = await getJson("/data/article/hello?resolve=true");
    const plain = await getJson("/data/article/hello");

    expect(second).toEqual(first);
    expect(plain.content).toEqual(expectedBlocks(FILES_URL));
  });

  it("returns 404 for unknown items", async () => {
    const response = await app.request("/data/article/unknown");

    expect(response.status).toBe(404);
  });
});

describe("write routes", () => {
  let editorial: Awaited<ReturnType<typeof createEditorialDirectory>>;
  let app: ReturnType<typeof createDataRoutes>;

  beforeEach(async () => {
    editorial = await createEditorialDirectory();
    app = createDataRoutes(config, createStorage(editorial.directory));
  });

  afterEach(async () => {
    await editorial.remove();
  });

  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  const getJson = async (path: string): Promise<any> => {
    const response = await app.request(path);
    expect(response.status).toBe(200);
    return response.json();
  };

  describe("PUT /data/:itemType/:id", () => {
    it("creates an item", async () => {
      const response = await send("PUT", "/data/tag/science", {
        type: "tag",
        id: "science",
        name: "Science",
      });

      expect(response.status).toBe(200);
      const { tag } = await editorial.readData();
      expect(tag.science).toMatchObject({
        id: "science",
        name: "Science",
        isDraft: false,
      });
    });

    it("returns 409 for an existing id and keeps the item", async () => {
      const response = await send("PUT", "/data/tag/news", {
        type: "tag",
        id: "news",
        name: "Overwritten",
      });

      expect(response.status).toBe(409);
      expect((await editorial.readData()).tag.news.name).toBe("News");
    });
  });

  describe("PATCH /data/:itemType/:id", () => {
    it("updates an item without touching other items", async () => {
      const before = await editorial.readData();

      const response = await send("PATCH", "/data/tag/news", {
        type: "tag",
        name: "Breaking news",
      });

      expect(response.status).toBe(200);
      const after = await editorial.readData();
      expect(after.tag.news).toMatchObject({
        id: "news",
        name: "Breaking news",
      });
      expect(after.tag.news.updatedAt).not.toBe(before.tag.news.updatedAt);
      expect(after.tag.news.createdAt).toBe(before.tag.news.createdAt);
      expect({ ...after, tag: {} }).toEqual({ ...before, tag: {} });
      expect(after.tag.tech).toEqual(before.tag.tech);
    });

    it("renames an item and the references to it", async () => {
      const response = await send("PATCH", "/data/author/ada", {
        type: "author",
        newId: "ada-lovelace",
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ id: "ada-lovelace" });

      const { author, article } = await editorial.readData();
      expect(Object.keys(author)).toEqual(["bob", "ada-lovelace"]);
      expect(author["ada-lovelace"]).toMatchObject({
        id: "ada-lovelace",
        name: "Ada",
      });
      expect(author["ada-lovelace"]).not.toHaveProperty("newId");
      expect(author.bob.mentor).toBe("ada-lovelace");

      const blocks = article.hello.content as Record<string, unknown>[];
      expect(blocks[3].author).toBe("ada-lovelace");
      // Blocks of unknown types are left as they are
      expect(blocks[4].author).toBe("ada");
    });

    it("returns 409 when the new id is taken and changes nothing", async () => {
      const before = await editorial.readData();

      const response = await send("PATCH", "/data/author/ada", {
        type: "author",
        newId: "bob",
      });

      expect(response.status).toBe(409);
      expect(await editorial.readData()).toEqual(before);
    });

    it("returns the updated item in later GET requests", async () => {
      // Fill the content cache first
      const { hello } = await getJson("/data/article?preview=true");
      expect(hello.title).toBe("Hello");

      await send("PATCH", "/data/article/hello", {
        type: "article",
        title: "Hello again",
      });

      const updated = await getJson("/data/article?preview=true");
      expect(updated.hello.title).toBe("Hello again");
      const item = await getJson("/data/article/hello?preview=true");
      expect(item.title).toBe("Hello again");
    });
  });

  describe("DELETE /data/:itemType/:id", () => {
    it("deletes the item and clears select references to it", async () => {
      const response = await send("DELETE", "/data/author/bob");

      expect(response.status).toBe(200);
      const { author, article } = await editorial.readData();
      expect(author).not.toHaveProperty("bob");
      expect(article.hello.author).toBeNull();
    });

    it("removes multiselect references, including inside blocks", async () => {
      await send("DELETE", "/data/tag/tech");

      const { tag, article } = await editorial.readData();
      expect(Object.keys(tag)).toEqual(["news"]);
      expect(article.hello.tags).toEqual(["news", "missing"]);
      const blocks = article.hello.content as Record<string, unknown>[];
      expect(blocks[3].tags).toEqual(["missing"]);
    });

    it("leaves production data untouched", async () => {
      const before = await editorial.readData("data.prod.json");

      await send("DELETE", "/data/author/bob");

      expect(await editorial.readData("data.prod.json")).toEqual(before);
    });
  });
});
