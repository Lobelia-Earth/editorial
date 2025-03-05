import { EditorialConfigSchema } from '@isardsat/editorial-common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml';

export async function createSchema(configDirectory: string) {
  const configFile = await readFile(
    join(configDirectory, 'schema.yaml'),
    'utf-8'
  ).then((value) => parse(value));

  const config = EditorialConfigSchema.parse(configFile);

  return config;
}
