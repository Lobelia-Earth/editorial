import { Ajv } from "ajv";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMetaSchema } from "./schema.js";

const validSchema = {
  page: {
    displayName: "Page",
    singleton: true,
    fields: {
      title: { type: "string", displayName: "Title" },
      content: {
        type: "blocks",
        displayName: "Content",
        optional: true,
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
};

const validate = (schema: unknown, allowedExtraFields?: string[]) => {
  const ajv = new Ajv({ allErrors: true });
  const isValid = ajv.validate(
    generateMetaSchema({ allowedExtraFields }),
    schema,
  );
  return { isValid, errors: ajv.errors ?? [] };
};

describe("generateMetaSchema", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("points the blocks of fields to the Block definition", () => {
    const { definitions } = generateMetaSchema();

    expect(definitions.Field.properties.blocks).toEqual({
      type: "object",
      additionalProperties: { $ref: "#/definitions/Block" },
    });
    expect(definitions.Block.properties.fields).toEqual({
      type: "object",
      additionalProperties: { $ref: "#/definitions/BlockField" },
    });
  });

  it("does not allow blocks inside block fields", () => {
    const { definitions } = generateMetaSchema();

    expect(definitions.BlockField.properties).not.toHaveProperty("blocks");
    expect(definitions.BlockField.properties.type.enum).not.toContain("blocks");
    expect(definitions.Field.properties.type.enum).toContain("blocks");
  });

  it("adds allowedExtraFields to fields and block fields", () => {
    const { definitions } = generateMetaSchema({
      allowedExtraFields: ["dontTranslate"],
    });

    expect(definitions.Field.properties).toHaveProperty("dontTranslate");
    expect(definitions.BlockField.properties).toHaveProperty("dontTranslate");
  });

  it("does not warn about unknown Zod types", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    generateMetaSchema();

    expect(warn).not.toHaveBeenCalled();
  });

  describe("validated with ajv", () => {
    it("accepts a schema with blocks", () => {
      const { isValid, errors } = validate(validSchema);

      expect(errors).toEqual([]);
      expect(isValid).toBe(true);
    });

    it("rejects nested blocks at the type of the block field", () => {
      const schema = structuredClone(validSchema) as any;
      schema.page.fields.content.blocks.text.fields.x = {
        type: "blocks",
        displayName: "Nested",
      };

      const { isValid, errors } = validate(schema);

      expect(isValid).toBe(false);
      expect(errors.map((error) => error.instancePath)).toContain(
        "/page/fields/content/blocks/text/fields/x/type",
      );
    });

    it("rejects unknown keys unless they are allowed extra fields", () => {
      const schema = structuredClone(validSchema) as any;
      schema.page.fields.title.dontTranslate = true;
      schema.page.fields.content.blocks.text.fields.body.dontTranslate = true;

      expect(validate(schema).isValid).toBe(false);
      expect(validate(schema, ["dontTranslate"]).isValid).toBe(true);
    });

    it("rejects blocks without displayName or fields", () => {
      const schema = structuredClone(validSchema) as any;
      schema.page.fields.content.blocks.text = { fields: {} };
      schema.page.fields.content.blocks.image = { displayName: "Image" };

      const { isValid, errors } = validate(schema);

      expect(isValid).toBe(false);
      expect(errors.map((error) => [error.instancePath, error.params])).toEqual(
        expect.arrayContaining([
          [
            "/page/fields/content/blocks/text",
            { missingProperty: "displayName" },
          ],
          ["/page/fields/content/blocks/image", { missingProperty: "fields" }],
        ]),
      );
    });
  });
});
