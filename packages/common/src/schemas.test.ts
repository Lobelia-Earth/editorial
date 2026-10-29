import { describe, expect, it } from "vitest";
import { EditorialSchemaSchema } from "./schemas.js";

const getIssues = (schema: unknown) => {
  const result = EditorialSchemaSchema.safeParse(schema);
  return result.success ? [] : result.error.issues;
};

describe("EditorialSchemaSchema", () => {
  it("accepts a blocks field with block types", () => {
    const result = EditorialSchemaSchema.safeParse({
      page: {
        displayName: "Page",
        fields: {
          content: {
            type: "blocks",
            displayName: "Content",
            blocks: {
              text: {
                displayName: "Text",
                fields: {
                  body: { type: "markdown", displayName: "Body" },
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
                },
              },
            },
          },
        },
      },
    });

    expect(result.success).toBe(true);
    expect(Object.keys(result.data!.page.fields.content.blocks ?? {})).toEqual([
      "text",
      "image",
    ]);
  });

  it.each([
    ["missing", undefined],
    ["empty", {}],
  ])("rejects a blocks field with %s block types", (_, blocks) => {
    const issues = getIssues({
      page: {
        displayName: "Page",
        fields: {
          content: { type: "blocks", displayName: "Content", blocks },
        },
      },
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe(
      "Blocks fields require at least one block type",
    );
    expect(issues[0].path).toEqual(["page", "fields", "content", "blocks"]);
  });

  it("rejects blocks nested inside blocks", () => {
    const issues = getIssues({
      page: {
        displayName: "Page",
        fields: {
          content: {
            type: "blocks",
            displayName: "Content",
            blocks: {
              section: {
                displayName: "Section",
                fields: {
                  children: {
                    type: "blocks",
                    displayName: "Children",
                    blocks: {
                      text: { displayName: "Text", fields: {} },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe(
      "Blocks fields cannot be nested inside blocks",
    );
    expect(issues[0].path).toEqual([
      "page",
      "fields",
      "content",
      "blocks",
      "section",
      "fields",
      "children",
    ]);
  });

  it("keeps extra loose keys on fields and block fields", () => {
    const result = EditorialSchemaSchema.safeParse({
      page: {
        displayName: "Page",
        fields: {
          title: {
            type: "string",
            displayName: "Title",
            dontTranslate: true,
          },
          content: {
            type: "blocks",
            displayName: "Content",
            blocks: {
              text: {
                displayName: "Text",
                fields: {
                  body: {
                    type: "markdown",
                    displayName: "Body",
                    dontTranslate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(result.success).toBe(true);
    const { fields } = result.data!.page;
    expect(fields.title.dontTranslate).toBe(true);
    expect(fields.content.blocks?.text.fields.body.dontTranslate).toBe(true);
  });

  it("defaults optional to false", () => {
    const result = EditorialSchemaSchema.parse({
      page: {
        displayName: "Page",
        fields: { title: { type: "string", displayName: "Title" } },
      },
    });

    expect(result.page.fields.title.optional).toBe(false);
  });
});
