import { readFile } from 'fs/promises';
import { join } from 'path';
import { EditorialConfigSchema } from '@isardsat/editorial-common';

export async function createConfig(configDirectory: string) {
  const configFile = await readFile(
    join(configDirectory, 'config.json'),
    'utf-8'
  ).then((value) => JSON.parse(value));

  const config = EditorialConfigSchema.parse(configFile);

  return config;
}
