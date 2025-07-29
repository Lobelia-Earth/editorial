import type {
  EditorialData,
  EditorialDataObjectWithType,
} from "@isardsat/editorial-common";
import {
  EditorialDataItemSchema,
  EditorialDataSchema,
  EditorialSchemaSchema,
} from "@isardsat/editorial-common";
import { readFile } from "fs/promises";
import { join } from "path";
import { parse } from "yaml";
import { writeFileSafe } from "./utils/fs.js";

export function createStorage(dataDirectory: string) {
  const schemaPath = join(dataDirectory, "schema.yaml");
  const dataPath = join(dataDirectory, "data.json");
  const dataProdPath = join(dataDirectory, "data.prod.json");
  const dataExtractedPath = join(dataDirectory, "data.messages.json");

  async function getSchema() {
    const schemaFile = await readFile(schemaPath, "utf-8").then((value) =>
      parse(value)
    );
    const schema = EditorialSchemaSchema.parse(schemaFile);

    return schema;
  }

  /**
   * TODO: This should ideally cache the result of reading the file until an update occurs.
   */
  async function getContent(): Promise<EditorialData> {
    return await readFile(dataPath, "utf-8").then((value) => JSON.parse(value));
  }

  async function getLocalisationMessages(langCode: string): Promise<any> {
    return await readFile(
      join(dataDirectory, "locales", "messages", `${langCode}.json`),
      "utf-8"
    ).then((value) => JSON.parse(value));
  }

  async function saveContent({ production }: { production?: boolean }) {
    const content = await getContent();

    await writeFileSafe(
      production ? dataProdPath : dataPath,
      JSON.stringify(EditorialDataSchema.parse(content), null, 2)
    );

    return true;
  }

  async function saveLocalisationMessages(messages: any) {
    await writeFileSafe(dataExtractedPath, JSON.stringify(messages, null, 2));

    return true;
  }

  async function createItem(item: EditorialDataObjectWithType) {
    const content = await getContent();
    content[item.type] = content[item.type] ?? {};
    content[item.type][item.id] = EditorialDataItemSchema.parse(item);

    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return item;
  }

  async function updateItem(item: EditorialDataObjectWithType) {
    const content = await getContent();
    const oldItem = content[item.type][item.id];

    const newItem = EditorialDataItemSchema.parse({
      ...oldItem,
      ...item,
      updatedAt: new Date().toISOString(),
    });

    content[item.type][item.id] = newItem;
    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return newItem;
  }

  async function deleteItem(item: EditorialDataObjectWithType) {
    const content = await getContent();
    delete content[item.type][item.id];
    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return content;
  }

  return {
    getSchema,
    getContent,
    getLocalisationMessages,
    saveLocalisationMessages,
    createItem,
    updateItem,
    deleteItem,
    saveContent,
  };
}
export type Storage = ReturnType<typeof createStorage>;
