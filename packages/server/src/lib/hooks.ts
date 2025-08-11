import { join } from "node:path";

export async function createHooks(configDirectory: string) {
  const hooksDirPath = join(configDirectory, "hooks");

  async function loadHook(name: string): Promise<Function | null> {
    try {
      const hookScript = join(process.cwd(), hooksDirPath, name);
      const module = await import(`${hookScript}.mjs`);

      const hookFunction =
        typeof module.default === "function" ? module.default : null;

      return hookFunction;
    } catch {
      return null;
    }
  }

  async function executeHook<T = any, Args extends any[] = any[]>(
    hookName: string,
    ...args: Args
  ): Promise<T | undefined> {
    const hook = await loadHook(hookName);
    if (!hook) return;

    return hook(...args);
  }

  async function onPublish(content: any, schema: any) {
    return executeHook("onPublish", content, schema);
  }

  async function onLocalize(content: any, schema: any): Promise<any> {
    return executeHook("onLocalize", content, schema);
  }

  async function onLocalizeEnd(content: any, schema: any) {
    return executeHook("onLocalizeEnd", content, schema);
  }

  async function onPull(author: string) {
    if (process.env.NODE_ENV !== "production") {
      console.info("Dropping onPull hook event in development environment");
      return;
    }

    return executeHook("onPull", author);
  }

  async function onPush(author: string) {
    if (process.env.NODE_ENV !== "production") {
      console.info("Dropping onPush hook event in development environment");
      return;
    }

    return executeHook("onPush", author);
  }

  return { onPublish, onLocalize, onLocalizeEnd, onPull, onPush };
}

export type Hooks = Awaited<ReturnType<typeof createHooks>>;
