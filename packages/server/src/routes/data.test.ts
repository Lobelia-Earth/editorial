import { EditorialConfigSchema } from "@isardsat/editorial-common";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { stringify } from "yaml";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createContent, schema } from "../__fixtures__/schema.js";
import { createStorage } from "../lib/storage.js";
import { createDataRoutes } from "./data.js";

const FILES_URL = "https://files.example.com";
const PREVIEW_ORIGIN = "http://localhost";

const config = EditorialConfigSchema.parse({
  name: "Test",
  publicUrl: "https://example.com",
  filesUrl: FILES_URL,
  largeFilesUrl: "https://large-files.example.com",
});

let editorialDirectory: string;
let app: ReturnType<typeof createDataRoutes>;

beforeAll(async () => {
  editorialDirectory = await mkdtemp(join(tmpdir(), "editorial-test-"));
  const content = JSON.stringify(createContent(), null, 2);

  await Promise.all([
    writeFile(join(editorialDirectory, "schema.yaml"), stringify(schema)),
    writeFile(join(editorialDirectory, "data.json"), content),
    writeFile(join(editorialDirectory, "data.prod.json"), content),
  ]);

  app = createDataRoutes(config, createStorage(editorialDirectory));
});

afterAll(async () => {
  await rm(editorialDirectory, { recursive: true, force: true });
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
