import { describe, expect, it } from "vitest";
import { getBlockSchema, getChoicesReference } from "./data-utils.js";
import type { EditorialSchemaItemField } from "./types.js";

describe("getChoicesReference", () => {
  it("returns the referenced collection of a $ choice", () => {
    expect(getChoicesReference(["$type"])).toBe("type");
  });

  it.each([
    ["undefined", undefined],
    ["no choices", []],
    ["fixed choices", ["a", "b"]],
    ["a single fixed choice", ["type"]],
    ["several references", ["$a", "$b"]],
    ["a bare $", ["$"]],
  ])("returns null for %s", (_, choices) => {
    expect(getChoicesReference(choices)).toBeNull();
  });
});

describe("getBlockSchema", () => {
  const textBlock = {
    displayName: "Text",
    fields: {
      body: { type: "markdown", displayName: "Body", optional: false },
    },
  } as const;

  const blocksField = {
    type: "blocks",
    displayName: "Content",
    optional: false,
    blocks: { text: textBlock },
  } as EditorialSchemaItemField;

  it("returns the schema of a known block type", () => {
    expect(getBlockSchema(blocksField, { _block: "text", body: "Hi" })).toBe(
      textBlock,
    );
  });

  it("returns null for an unknown block type", () => {
    expect(getBlockSchema(blocksField, { _block: "video" })).toBeNull();
  });

  it.each([
    ["null", null],
    ["a string", "text"],
    ["a number", 1],
    ["an object without _block", { body: "Hi" }],
    ["an object with a non-string _block", { _block: 1 }],
  ])("returns null for %s", (_, block) => {
    expect(getBlockSchema(blocksField, block)).toBeNull();
  });

  it("returns null for fields that are not blocks fields", () => {
    const stringField = {
      type: "string",
      displayName: "Title",
      optional: false,
    } as EditorialSchemaItemField;

    expect(getBlockSchema(stringField, { _block: "text" })).toBeNull();
  });
});
