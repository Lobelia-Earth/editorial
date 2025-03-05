import { join } from 'node:path';

export async function createHooks(configDirectory: string) {
  const hooksDirPath = join(configDirectory, 'hooks');

  async function onPublish() {
    // TODO: Implement.
  }

  async function onLocalize(content: any, schema: any): Promise<any> {
    const onPublishScript = join(process.cwd(), hooksDirPath, 'onLocalize');
    const module = await import(`${onPublishScript}.mjs`);

    const hookFunction =
      typeof module.default === 'function' ? module.default : null;

    return hookFunction(content, schema);
  }

  return { onPublish, onLocalize };
}
export type Hooks = Awaited<ReturnType<typeof createHooks>>;
