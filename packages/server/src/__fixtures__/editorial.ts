import {
  EditorialConfigSchema,
  type EditorialData,
} from "@isardsat/editorial-common";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { stringify } from "yaml";
import { createContent, schema } from "./schema.js";

export const FILES_URL = "https://files.example.com";

export const config = EditorialConfigSchema.parse({
  name: "Test",
  publicUrl: "https://example.com",
  filesUrl: FILES_URL,
  largeFilesUrl: "https://large-files.example.com",
});

/**
 * Writes an `editorial/` folder with the fixture schema to a temporary
 * directory. Preview and production content default to the fixture content.
 */
export async function createEditorialDirectory({
  preview = createContent(),
  production = createContent(),
}: { preview?: EditorialData; production?: EditorialData } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "editorial-test-"));

  await Promise.all([
    writeFile(join(directory, "schema.yaml"), stringify(schema)),
    writeFile(join(directory, "data.json"), JSON.stringify(preview, null, 2)),
    writeFile(
      join(directory, "data.prod.json"),
      JSON.stringify(production, null, 2),
    ),
  ]);

  return {
    directory,
    /** Reads the content as stored on disk */
    readData: async (
      file: "data.json" | "data.prod.json" = "data.json",
    ): Promise<EditorialData> =>
      JSON.parse(await readFile(join(directory, file), "utf-8")),
    remove: () => rm(directory, { recursive: true, force: true }),
  };
}
