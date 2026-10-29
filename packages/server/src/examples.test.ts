import { Ajv } from "ajv";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { createConfig } from "./lib/config.js";
import { createSchema } from "./lib/schema.js";
import { createStorage } from "./lib/storage.js";
import { generateMetaSchema } from "./lib/utils/schema.js";

const examplesDirectory = resolve(import.meta.dirname, "../../../examples");

const examples = readdirSync(examplesDirectory).filter((name) =>
  existsSync(join(examplesDirectory, name, "editorial")),
);

describe("examples", () => {
  it("finds the example projects", () => {
    expect(examples).toEqual(expect.arrayContaining(["basic", "i18n"]));
  });

  describe.each(examples)("%s", (example) => {
    const editorialDirectory = join(examplesDirectory, example, "editorial");
    const storage = createStorage(editorialDirectory);

    it("has a valid config", async () => {
      await expect(createConfig(editorialDirectory)).resolves.toBeDefined();
    });

    it("has a valid schema", async () => {
      await expect(createSchema(editorialDirectory)).resolves.toBeDefined();
    });

    it("has a schema that passes the meta-schema", () => {
      const schema = parse(
        readFileSync(join(editorialDirectory, "schema.yaml"), "utf-8"),
      );
      const ajv = new Ajv({ allErrors: true });

      ajv.validate(generateMetaSchema(), schema);

      expect(ajv.errors ?? []).toEqual([]);
    });

    it("has valid data for the types in the schema", async () => {
      const [schema, content] = await Promise.all([
        storage.getSchema(),
        storage.getContent({ production: false }),
      ]);

      for (const [itemType, collection] of Object.entries(content)) {
        expect(schema).toHaveProperty(itemType);
        for (const [key, item] of Object.entries(collection)) {
          expect(item.id).toBe(key);
        }
      }
    });
  });
});
