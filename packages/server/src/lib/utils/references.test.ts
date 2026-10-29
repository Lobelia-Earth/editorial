import type { EditorialDataItem } from "@isardsat/editorial-common";
import { describe, expect, it, vi } from "vitest";
import { createContent, schema } from "../../__fixtures__/schema.js";
import type { Storage } from "../storage.js";
import {
  resolveFileUrls,
  resolveReferences,
  updateOrRemoveReferences,
} from "./references.js";

const ORIGIN = "https://files.example.com";

describe("resolveFileUrls", () => {
  it("prefixes uploaded files with the origin, including inside blocks", () => {
    const { article } = createContent();

    const resolved = resolveFileUrls(article.hello, schema, "article", ORIGIN);

    expect(resolved.cover).toBe(`${ORIGIN}/covers/hello.png`);
    expect(resolved.content).toEqual([
      { _block: "text", body: "Intro" },
      { _block: "image", file: `${ORIGIN}/images/a.png`, caption: "A" },
      {
        _block: "image",
        file: "https://cdn.example.com/b.png",
        caption: "B",
      },
      { _block: "quote", author: "ada", tags: ["tech", "missing"] },
      { _block: "video", file: "videos/v.mp4", author: "ada" },
    ]);
  });

  it("leaves http values and fields that are not uploaded files untouched", () => {
    const { author } = createContent();

    const resolved = resolveFileUrls(author.bob, schema, "author", ORIGIN);

    expect(resolved).toEqual(author.bob);
  });

  it("returns a copy for unknown item types", () => {
    const { article } = createContent();

    const resolved = resolveFileUrls(article.hello, schema, "unknown", ORIGIN);

    expect(resolved).toEqual(article.hello);
    expect(resolved).not.toBe(article.hello);
  });

  it("does not mutate its input", () => {
    const content = createContent();

    resolveFileUrls(content.article.hello, schema, "article", ORIGIN);

    expect(content).toEqual(createContent());
  });
});

describe("resolveReferences", () => {
  it("replaces select and multiselect ids with the items, recursively", () => {
    const content = createContent();

    const resolved = resolveReferences(
      content.article.hello,
      schema,
      "article",
      content,
      ORIGIN,
    );

    expect(resolved.author).toEqual({
      ...content.author.bob,
      mentor: {
        ...content.author.ada,
        avatar: `${ORIGIN}/authors/ada.png`,
      },
    });
    // Missing ids are dropped
    expect(resolved.tags).toEqual([content.tag.news, content.tag.tech]);
  });

  it("resolves references inside blocks", () => {
    const content = createContent();

    const resolved = resolveReferences(
      content.article.hello,
      schema,
      "article",
      content,
      ORIGIN,
    );
    const blocks = resolved.content as Record<string, unknown>[];

    expect(blocks[3]).toEqual({
      _block: "quote",
      author: { ...content.author.ada, avatar: `${ORIGIN}/authors/ada.png` },
      tags: [content.tag.tech],
    });
    expect(blocks[1].file).toBe(`${ORIGIN}/images/a.png`);
    // Blocks of unknown types are kept as they are
    expect(blocks[4]).toEqual({
      _block: "video",
      file: "videos/v.mp4",
      author: "ada",
    });
  });

  it("stops at circular references", () => {
    const content = createContent();
    content.author.ada.mentor = "bob";

    const resolved = resolveReferences(
      content.author.ada,
      schema,
      "author",
      content,
      ORIGIN,
    );

    const bob = resolved.mentor as EditorialDataItem;
    expect(bob.id).toBe("bob");
    const ada = bob.mentor as EditorialDataItem;
    expect(ada.id).toBe("ada");
    // ada was already resolved, so her mentor stays as an id
    expect(ada.mentor).toBe("bob");
    expect(ada.avatar).toBe(`${ORIGIN}/authors/ada.png`);
  });

  it("does not mutate its input", () => {
    const content = createContent();

    resolveReferences(
      content.article.hello,
      schema,
      "article",
      content,
      ORIGIN,
    );

    expect(content).toEqual(createContent());
  });
});

describe("updateOrRemoveReferences", () => {
  const createStorage = () => {
    const updateItem = vi.fn(async (item: unknown) => item);
    return { storage: { updateItem } as unknown as Storage, updateItem };
  };

  const getUpdatedItem = (
    updateItem: ReturnType<typeof createStorage>["updateItem"],
    type: string,
    id: string,
  ) =>
    updateItem.mock.calls
      .map(([item]) => item as EditorialDataItem & { type: string })
      .find((item) => item.type === type && item.id === id);

  it("renames an id in top-level fields and fields inside blocks", async () => {
    const content = createContent();
    const { storage, updateItem } = createStorage();

    await updateOrRemoveReferences({
      schema,
      content,
      storage,
      targetType: "tag",
      oldId: "tech",
      newId: "technology",
    });

    expect(updateItem).toHaveBeenCalledTimes(1);
    const article = getUpdatedItem(updateItem, "article", "hello")!;
    expect(article.tags).toEqual(["news", "missing", "technology"]);
    expect((article.content as unknown[])[3]).toEqual({
      _block: "quote",
      author: "ada",
      tags: ["technology", "missing"],
    });
  });

  it("renames select references in every collection", async () => {
    const content = createContent();
    const { storage, updateItem } = createStorage();

    await updateOrRemoveReferences({
      schema,
      content,
      storage,
      targetType: "author",
      oldId: "ada",
      newId: "ada-lovelace",
    });

    expect(updateItem).toHaveBeenCalledTimes(2);
    expect(getUpdatedItem(updateItem, "author", "bob")!.mentor).toBe(
      "ada-lovelace",
    );
    const article = getUpdatedItem(updateItem, "article", "hello")!;
    expect(article.author).toBe("bob");
    expect((article.content as Record<string, unknown>[])[3].author).toBe(
      "ada-lovelace",
    );
    // Unknown block types are not patched
    expect((article.content as Record<string, unknown>[])[4].author).toBe(
      "ada",
    );
  });

  it("sets select to null and filters multiselect when removing an id", async () => {
    const content = createContent();
    const { storage, updateItem } = createStorage();

    await updateOrRemoveReferences({
      schema,
      content,
      storage,
      targetType: "author",
      oldId: "bob",
      newId: null,
    });

    expect(getUpdatedItem(updateItem, "article", "hello")!.author).toBeNull();

    const tags = createStorage();
    await updateOrRemoveReferences({
      schema,
      content,
      storage: tags.storage,
      targetType: "tag",
      oldId: "tech",
      newId: null,
    });

    const article = getUpdatedItem(tags.updateItem, "article", "hello")!;
    expect(article.tags).toEqual(["news", "missing"]);
    expect((article.content as Record<string, unknown>[])[3].tags).toEqual([
      "missing",
    ]);
  });

  it("does not write anything when nothing references the id", async () => {
    const content = createContent();
    const { storage, updateItem } = createStorage();

    await updateOrRemoveReferences({
      schema,
      content,
      storage,
      targetType: "tag",
      oldId: "unused",
      newId: "renamed",
    });

    expect(updateItem).not.toHaveBeenCalled();
  });

  it("keeps the identity of unchanged blocks and does not mutate content", async () => {
    const content = createContent();
    const { storage, updateItem } = createStorage();

    await updateOrRemoveReferences({
      schema,
      content,
      storage,
      targetType: "author",
      oldId: "ada",
      newId: "ada-lovelace",
    });

    const original = content.article.hello.content as unknown[];
    const updated = getUpdatedItem(updateItem, "article", "hello")!
      .content as unknown[];

    expect(updated).not.toBe(original);
    for (const index of [0, 1, 2, 4]) {
      expect(updated[index]).toBe(original[index]);
    }
    expect(updated[3]).not.toBe(original[3]);
    expect(content).toEqual(createContent());
  });
});
