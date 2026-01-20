import type {
  EditorialData,
  EditorialDataItem,
  EditorialDataObjectWithType,
} from "@isardsat/editorial-common";
import {
  EditorialDataItemSchema,
  EditorialDataSchema,
  EditorialSchemaSchema,
} from "@isardsat/editorial-common";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { parse } from "yaml";
import { writeFileSafe } from "./utils/fs.js";

export function createStorage(dataDirectory: string) {
  const schemaPath = join(dataDirectory, "schema.yaml");
  const dataPath = join(dataDirectory, "data.json");
  const dataProdPath = join(dataDirectory, "data.prod.json");
  const dataExtractedPath = join(dataDirectory, "data.messages.json");
  const localesPath = join(dataDirectory, "locales", "messages");

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
  async function getContent({
    production,
  }: {
    production?: boolean;
  }): Promise<EditorialData> {
    const content = await readFile(
      production ? dataProdPath : dataPath,
      "utf-8"
    ).then((value) => EditorialDataSchema.parse(JSON.parse(value)));

    return content;
  }

  async function getLocalisationMessages(langCode: string): Promise<any> {
    return await readFile(
      join(dataDirectory, "locales", "messages", `${langCode}.json`),
      "utf-8"
    ).then((value) => JSON.parse(value));
  }

  async function saveContent({ production }: { production?: boolean }) {
    const content = await getContent({ production: false });

    /** Do not save any items that have `isDraft` */
    if (production) {
      const filteredContent: EditorialData = {};

      for (const [itemType, items] of Object.entries(content)) {
        filteredContent[itemType] = {};
        const typedItems = items as Record<string, EditorialDataItem>;

        for (const [itemId, item] of Object.entries(typedItems)) {
          if (!item.isDraft) {
            filteredContent[itemType][itemId] = item;
          }
        }
      }

      await writeFileSafe(
        dataProdPath,
        JSON.stringify(EditorialDataSchema.parse(filteredContent), null, 2)
      );

      return true;
    }

    await writeFileSafe(
      dataPath,
      JSON.stringify(EditorialDataSchema.parse(content), null, 2)
    );

    return true;
  }

  async function getAllLocalesMessages(dir: string) {
    const files = await readdir(dir);

    return Promise.all(
      files.map(async (file) => ({
        file,
        path: join(dir, file),
        messages: JSON.parse(await readFile(join(dir, file), "utf-8")),
      }))
    );
  }

  function pruneMessages(
    messages: Record<string, any>,
    deletedItemKeys: string[]
  ) {
    const pruned = { ...messages };

    deletedItemKeys.forEach((key) => {
      if (pruned.hasOwnProperty(key)) {
        delete pruned[key];
      }
    });

    return pruned;
  }

  async function saveLocalisationMessages(newMessages: any) {
    const productionMessages = await readFile(dataExtractedPath, "utf-8").then(
      (value) => JSON.parse(value)
    );

    await writeFileSafe(
      dataExtractedPath,
      JSON.stringify(newMessages, null, 2)
    );

    /**
     * Get deleted items by checking
     * keys that are in productionMessages but not in newMessages
     */
    const deletedItemKeys: string[] = [];
    for (const itemType of Object.keys(productionMessages)) {
      if (!newMessages[itemType]) {
        /**
         * We need to store both the full itemType with hash and the shortItemType without hash
         * The itemType is used for locale files starting with underscore _
         * The shortItemType is used for normal locale files
         */
        deletedItemKeys.push(itemType);
        const shortItemType = itemType.split(".").slice(0, -1).join(".");
        deletedItemKeys.push(shortItemType);
      }
    }

    if (deletedItemKeys.length === 0) return true;

    const locales = await getAllLocalesMessages(localesPath);
    for (const locale of locales) {
      const pruned = pruneMessages(locale.messages, deletedItemKeys);
      await writeFileSafe(locale.path, JSON.stringify(pruned, null, 2));
    }

    return true;
  }

  async function createItem(item: EditorialDataObjectWithType) {
    const content = await getContent({ production: false });
    content[item.type] = content[item.type] ?? {};

    const parsedItem = EditorialDataItemSchema.parse(item);
    content[item.type][item.id] = parsedItem;

    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return parsedItem;
  }

  async function updateItem(item: EditorialDataObjectWithType) {
    const content = await getContent({ production: false });
    content[item.type] = content[item.type] ?? {};
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
    const content = await getContent({ production: false });
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
