import { readFile } from 'fs/promises';
import { join } from 'path';
import { writeFileSafe } from './utils/fs.js';
import type { EditorialObject } from './types.js';
import { parse } from 'yaml';
import { EditorialSchemaSchema } from './schemas.js';

export function createStorage(dataDirectory: string) {
  const schemaPath = join(dataDirectory, 'schema.yaml');
  const dataPath = join(dataDirectory, 'data.json');

  async function getSchema() {
    const schemaFile = await readFile(schemaPath, 'utf-8').then((value) =>
      parse(value)
    );
    const schema = EditorialSchemaSchema.parse(schemaFile);

    return schema;
  }

  /**
   * TODO: This should ideally cache the result of reading the file until an update occurs.
   */
  async function getContent() {
    return await readFile(dataPath, 'utf-8').then((value) => JSON.parse(value));
  }

  async function createItem(item: EditorialObject) {
    const content = await getContent();
    content[item.type][item.id] = item;
    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));
    return item;
  }

  async function updateItem(item: EditorialObject) {
    const content = await getContent();
    const oldItem = content[item.type][item.id];
    const newItem = {
      ...oldItem,
      ...item,
    };
    content[item.type][item.id] = newItem;
    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return newItem;
  }

  async function deleteItem(item: Pick<EditorialObject, 'id' | 'type'>) {
    const content = await getContent();
    delete content[item.type][item.id];
    // TODO: Use superjson to safely encode different types.
    await writeFileSafe(dataPath, JSON.stringify(content, null, 2));

    return content;
  }

  return { getSchema, getContent, createItem, updateItem, deleteItem };
}
export type Storage = ReturnType<typeof createStorage>;
