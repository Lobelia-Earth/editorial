import { join } from 'node:path';

export async function createHooks(configDirectory: string) {
  const hooksDirPath = join(configDirectory, 'hooks');

  async function loadHook(name: string): Promise<Function | null> {
    const onLocalizeScript = join(process.cwd(), hooksDirPath, 'onLocalize');
    const module = await import(`${onLocalizeScript}.mjs`);

    const hookFunction =
      typeof module.default === 'function' ? module.default : null;

    return hookFunction;
  }

  async function onPublish(content: any, schema: any) {
    const onPublishHook = await loadHook('onPublish');

    if (!onPublishHook) return;

    return onPublishHook(content, schema);
  }

  async function onLocalize(content: any, schema: any): Promise<any> {
    const onLocalizeHook = await loadHook('onLocalize');

    if (!onLocalizeHook) return;

    return onLocalizeHook(content, schema);
  }

  async function onLocalizeEnd(content: any, schema: any) {
    const onLocalizeEndHook = await loadHook('onLocalizeEnd');

    if (!onLocalizeEndHook) return;

    return onLocalizeEndHook(content, schema);
  }

  return { onPublish, onLocalize, onLocalizeEnd };
}
export type Hooks = Awaited<ReturnType<typeof createHooks>>;
