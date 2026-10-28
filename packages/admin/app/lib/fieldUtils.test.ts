import { EditorialSchemaItemFieldSchema } from "@isardsat/editorial-common";
import { describe, expect, it } from "vitest";
import {
  getFieldDefaultValue,
  getFieldStoredValue,
  getFieldValidationSchema,
  getNewBlockFormValue,
  resolveFieldChoices,
  type SchemaField,
} from "./fieldUtils";

const field = (config: Record<string, unknown>): SchemaField =>
  EditorialSchemaItemFieldSchema.parse({ displayName: "Field", ...config });

const blocksField = field({
  type: "blocks",
  displayName: "Content",
  blocks: {
    text: {
      displayName: "Text",
      fields: {
        title: { type: "string", displayName: "Title" },
        body: { type: "markdown", displayName: "Body", optional: true },
      },
    },
    image: {
      displayName: "Image",
      fields: {
        file: {
          type: "string",
          displayName: "File",
          isUploadedFile: true,
        },
        fullWidth: { type: "boolean", displayName: "Full width" },
        tags: {
          type: "multiselect",
          displayName: "Tags",
          optional: true,
        },
      },
    },
  },
});

const getIssues = (schemaField: SchemaField, value: unknown) => {
  const result = getFieldValidationSchema(schemaField).safeParse(value);
  return result.success
    ? []
    : result.error.issues.map(({ path, message }) => ({ path, message }));
};

describe("getFieldDefaultValue", () => {
  it.each([
    ["boolean true", { type: "boolean" }, true, "true"],
    ["boolean false", { type: "boolean" }, false, "false"],
    ["missing boolean", { type: "boolean" }, undefined, "false"],
    ["multiselect array", { type: "multiselect" }, ["a", "b"], ["a", "b"]],
    ["multiselect single value", { type: "multiselect" }, "a", ["a"]],
    ["missing multiselect", { type: "multiselect" }, undefined, []],
    ["number", { type: "number" }, 3, "3"],
    ["string", { type: "string" }, "Hello", "Hello"],
    ["missing string", { type: "string" }, undefined, ""],
    ["null string", { type: "string" }, null, ""],
    ["missing select", { type: "select" }, undefined, ""],
  ])("converts a %s", (_, config, value, expected) => {
    expect(getFieldDefaultValue(field(config), value)).toEqual(expected);
  });

  it.each([
    ["missing", undefined],
    ["non-array", "x"],
  ])("converts %s blocks to an empty list", (_, value) => {
    expect(getFieldDefaultValue(blocksField, value)).toEqual([]);
  });

  it("converts the fields of each block", () => {
    const unknownBlock = { _block: "video", url: "v.mp4", autoplay: true };

    expect(
      getFieldDefaultValue(blocksField, [
        { _block: "text", title: "Hi", extra: 1 },
        { _block: "image", file: "a.png", fullWidth: true, tags: "x" },
        unknownBlock,
      ]),
    ).toEqual([
      { _block: "text", title: "Hi", body: "", extra: 1 },
      { _block: "image", file: "a.png", fullWidth: "true", tags: ["x"] },
      unknownBlock,
    ]);
  });

  it("keeps blocks of unknown types as they are", () => {
    const unknownBlock = { _block: "video", autoplay: true };

    const [value] = getFieldDefaultValue(blocksField, [unknownBlock]);

    expect(value).toBe(unknownBlock);
  });
});

describe("getFieldStoredValue", () => {
  it.each([
    ["true", true],
    ["false", false],
    ["", false],
  ])("converts boolean %j to %j", (value, expected) => {
    expect(getFieldStoredValue(field({ type: "boolean" }), value)).toBe(
      expected,
    );
  });

  it.each([
    ["string", "Hello"],
    ["multiselect", ["a", "b"]],
    ["number", "3"],
  ])("keeps %s values as they are", (type, value) => {
    expect(getFieldStoredValue(field({ type }), value)).toBe(value);
  });

  it("converts the fields of each block, including booleans", () => {
    const unknownBlock = { _block: "video", autoplay: "true" };

    expect(
      getFieldStoredValue(blocksField, [
        { _block: "text", title: "Hi", body: "", extra: 1 },
        { _block: "image", file: "a.png", fullWidth: "true", tags: [] },
        { _block: "image", file: "b.png", fullWidth: "false", tags: ["x"] },
        unknownBlock,
      ]),
    ).toEqual([
      { _block: "text", title: "Hi", body: "", extra: 1 },
      { _block: "image", file: "a.png", fullWidth: true, tags: [] },
      { _block: "image", file: "b.png", fullWidth: false, tags: ["x"] },
      unknownBlock,
    ]);
  });

  it("round-trips stored blocks through the form format", () => {
    const stored = [
      { _block: "text", title: "Hi", body: "**Bold**" },
      { _block: "image", file: "a.png", fullWidth: true, tags: ["x"] },
    ];

    expect(
      getFieldStoredValue(
        blocksField,
        getFieldDefaultValue(blocksField, stored),
      ),
    ).toEqual(stored);
  });
});

describe("getNewBlockFormValue", () => {
  it("creates empty values for each block field", () => {
    expect(getNewBlockFormValue(blocksField.blocks!.image, "image")).toEqual({
      _block: "image",
      file: "",
      fullWidth: "false",
      tags: [],
    });
    expect(getNewBlockFormValue(blocksField.blocks!.text, "text")).toEqual({
      _block: "text",
      title: "",
      body: "",
    });
  });
});

describe("getFieldValidationSchema", () => {
  it("requires non-optional strings", () => {
    const title = field({ type: "string", displayName: "Title" });

    expect(getIssues(title, "Hi")).toEqual([]);
    expect(getIssues(title, "")).toEqual([
      { path: [], message: "Title is required" },
    ]);
  });

  it("allows empty and missing optional strings", () => {
    const subtitle = field({ type: "string", optional: true });

    expect(getIssues(subtitle, "")).toEqual([]);
    expect(getIssues(subtitle, undefined)).toEqual([]);
  });

  it("validates urls", () => {
    const url = field({ type: "url" });

    expect(getIssues(url, "https://example.com")).toEqual([]);
    expect(getIssues(url, "not a url")).toMatchObject([
      { message: "Must be a valid URL" },
    ]);
    expect(getIssues(field({ type: "url", optional: true }), "")).toEqual([]);
  });

  it("only accepts the fixed choices of selects", () => {
    const select = field({ type: "select", choicesFixed: ["a", "b"] });

    expect(getIssues(select, "a")).toEqual([]);
    expect(getIssues(select, "c")).toHaveLength(1);
  });

  it.each([
    ["referenced choices", { choicesFixed: ["$tag"] }],
    ["free input", { choicesFixed: ["a"], allowFreeInput: true }],
  ])("accepts any string for selects with %s", (_, config) => {
    expect(getIssues(field({ type: "select", ...config }), "c")).toEqual([]);
  });

  it("applies the min and max of multiselects", () => {
    const tags = field({
      type: "multiselect",
      displayName: "Tags",
      minSelectedChoices: 2,
      maxSelectedChoices: 3,
    });

    expect(getIssues(tags, ["a", "b"])).toEqual([]);
    expect(getIssues(tags, ["a"])).toEqual([
      { path: [], message: "Tags requires at least 2 selections" },
    ]);
    expect(getIssues(tags, ["a", "b", "c", "d"])).toEqual([
      { path: [], message: "Tags allows maximum 3 selections" },
    ]);
  });

  it("requires one selection in non-optional multiselects", () => {
    const tags = field({ type: "multiselect", displayName: "Tags" });

    expect(getIssues(tags, [])).toEqual([
      { path: [], message: "Tags requires at least one selection" },
    ]);
    expect(
      getIssues(field({ type: "multiselect", optional: true }), []),
    ).toEqual([]);
  });

  it("requires at least one block in non-optional blocks fields", () => {
    expect(getIssues(blocksField, [])).toEqual([
      { path: [], message: "Content requires at least one block" },
    ]);
    expect(
      getIssues({ ...blocksField, optional: true } as SchemaField, []),
    ).toEqual([]);
  });

  it("accepts valid blocks", () => {
    expect(
      getIssues(blocksField, [
        { _block: "text", title: "Hi", body: "" },
        { _block: "image", file: "a.png", fullWidth: "false", tags: [] },
      ]),
    ).toEqual([]);
  });

  it("reports errors at the path of the block field", () => {
    expect(
      getIssues(blocksField, [
        { _block: "text", title: "Hi", body: "" },
        { _block: "image", file: "", fullWidth: "false", tags: [] },
      ]),
    ).toEqual([{ path: [1, "file"], message: "File is required" }]);
  });

  it("rejects blocks of unknown types", () => {
    expect(
      getIssues(blocksField, [
        { _block: "text", title: "Hi", body: "" },
        { _block: "video", url: "v.mp4" },
      ]),
    ).toEqual([
      {
        path: [1, "_block"],
        message: "Unknown block type, remove this block to save",
      },
    ]);
  });
});

describe("resolveFieldChoices", () => {
  const item = (id: string) => ({
    id,
    isDraft: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  const allData = { tag: { news: item("news"), tech: item("tech") } };

  it("returns the ids of the referenced collection", () => {
    expect(
      resolveFieldChoices(
        field({ type: "multiselect", choicesFixed: ["$tag"] }),
        allData,
      ),
    ).toEqual(["news", "tech"]);
  });

  it("returns no choices when the referenced collection doesn't exist", () => {
    expect(
      resolveFieldChoices(
        field({ type: "select", choicesFixed: ["$author"] }),
        allData,
      ),
    ).toEqual([]);
  });

  it("returns fixed choices as they are", () => {
    expect(
      resolveFieldChoices(
        field({ type: "select", choicesFixed: ["a", "b"] }),
        allData,
      ),
    ).toEqual(["a", "b"]);
    expect(resolveFieldChoices(field({ type: "select" }), allData)).toEqual([]);
  });
});
