import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEditorialDirectory } from "../__fixtures__/editorial.js";
import { createStorage, type Storage } from "./storage.js";

describe("storage writes", () => {
  let editorial: Awaited<ReturnType<typeof createEditorialDirectory>>;
  let storage: Storage;

  beforeEach(async () => {
    editorial = await createEditorialDirectory();
    storage = createStorage(editorial.directory);
  });

  afterEach(async () => {
    await editorial.remove();
  });

  it("runs writes one at a time", async () => {
    const order: string[] = [];
    let releaseFirst = () => {};

    const first = storage.withWriteLock(async () => {
      order.push("first start");
      await new Promise<void>((resolve) => (releaseFirst = resolve));
      order.push("first end");
    });
    const second = storage.updateItem({ type: "tag", id: "news" }).then(() => {
      order.push("second");
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(order).toEqual(["first start"]);

    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(["first start", "first end", "second"]);
  });

  it("runs writes made inside the lock directly", async () => {
    const item = await storage.withWriteLock(() =>
      storage.updateItem({ type: "tag", id: "news", name: "Nested" }),
    );

    expect(item.name).toBe("Nested");
  });

  it("keeps running writes after one fails", async () => {
    const failed = storage.withWriteLock(async () => {
      throw new Error("Write failed");
    });
    const next = storage.updateItem({ type: "tag", id: "news", name: "Next" });

    await expect(failed).rejects.toThrow("Write failed");
    expect((await next).name).toBe("Next");
  });
});
