import type { EditorialDataItem } from "@isardsat/editorial-common";
import { describe, expect, it } from "vitest";
import { deepEqual, getChangedFields } from "./diff.js";

const item = (values: Record<string, unknown>): EditorialDataItem => ({
  id: "item",
  isDraft: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...values,
});

describe("deepEqual", () => {
  it.each([
    [1, 1],
    ["a", "a"],
    [null, null],
    [
      [1, [2, 3]],
      [1, [2, 3]],
    ],
    [
      { a: 1, b: { c: [1, 2] } },
      { b: { c: [1, 2] }, a: 1 },
    ],
  ])("treats %j and %j as equal", (a, b) => {
    expect(deepEqual(a, b)).toBe(true);
  });

  it.each([
    [1, "1"],
    [null, undefined],
    [null, {}],
    [[], {}],
    [
      [1, 2],
      [2, 1],
    ],
    [[1], [1, 2]],
    [{ a: 1 }, { a: 1, b: 2 }],
    [{ a: 1 }, { b: 1 }],
    [{ a: { b: 1 } }, { a: { b: 2 } }],
  ])("treats %j and %j as different", (a, b) => {
    expect(deepEqual(a, b)).toBe(false);
  });
});

describe("getChangedFields", () => {
  const blocks = [
    { _block: "text", body: "Intro" },
    { _block: "image", file: "a.png", caption: "A" },
  ];

  it("ignores updatedAt and createdAt", () => {
    expect(
      getChangedFields(
        item({ updatedAt: "2026-02-01T00:00:00.000Z" }),
        item({ createdAt: "2025-01-01T00:00:00.000Z" }),
      ),
    ).toEqual([]);
  });

  it("returns the fields with different values", () => {
    expect(
      getChangedFields(
        item({ title: "New", tags: ["a"], same: "x" }),
        item({ title: "Old", tags: ["a", "b"], same: "x" }),
      ),
    ).toEqual(["title", "tags"]);
  });

  it("treats equal blocks as unchanged", () => {
    expect(
      getChangedFields(
        item({ content: structuredClone(blocks) }),
        item({ content: structuredClone(blocks) }),
      ),
    ).toEqual([]);
  });

  it.each([
    ["a block field changes", [blocks[0], { ...blocks[1], caption: "B" }]],
    ["blocks are reordered", [blocks[1], blocks[0]]],
    ["a block is removed", [blocks[0]]],
    ["a block is added", [...blocks, { _block: "text", body: "End" }]],
  ])("detects blocks changes when %s", (_, content) => {
    expect(
      getChangedFields(item({ content }), item({ content: blocks })),
    ).toEqual(["content"]);
  });

  it("detects fields that only exist in one of the items", () => {
    expect(
      getChangedFields(item({ added: "x" }), item({ removed: "y" })),
    ).toEqual(["added", "removed"]);
  });

  it("ignores fields emptied in preview", () => {
    expect(
      getChangedFields(item({ title: "" }), item({ title: "Old" })),
    ).toEqual([]);
  });
});
