import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EDITORIAL_SESSION_HEADER,
  EditorialLockSchema,
  type EditorialConfig,
} from "@isardsat/editorial-common";
import type { Locks } from "../lib/locks.js";
import { firebaseAuth } from "../lib/middleware/auth.js";
import type { Storage } from "../lib/storage.js";

const ItemParamsSchema = z.object({
  itemType: z.string().openapi({
    param: { name: "itemType", in: "path" },
    example: "newsItem",
  }),
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    example: "about-us",
  }),
});

// Header names are validated in lowercase
const SESSION_KEY = EDITORIAL_SESSION_HEADER.toLowerCase();

const SessionHeadersSchema = z.object({
  [SESSION_KEY]: z
    .string()
    .min(1)
    .openapi({
      param: { name: EDITORIAL_SESSION_HEADER, in: "header" },
      description: "Random id of the browser tab editing the item",
    }),
});

/** Response of writes rejected because another session holds the lock */
export const lockedResponse = {
  content: {
    "application/json": {
      schema: z.object({ error: z.string(), lock: EditorialLockSchema }),
    },
  },
  description: "Another session is editing the item",
};

export function createLockRoutes(
  config: EditorialConfig,
  storage: Storage,
  locks: Locks,
) {
  const app = new OpenAPIHono();

  app.openapi(
    createRoute({
      method: "get",
      path: "/locks/{itemType}/{id}",
      summary: "Get who else is editing an item",
      request: {
        params: ItemParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialLockSchema.nullable(),
            },
          },
          description:
            "The item's lock, or null if nobody else is editing it. A lock held by the session in the header counts as nobody else.",
        },
      },
      tags: ["Locks"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    (c) => {
      const { itemType, id } = c.req.valid("param");
      const session = c.req.header(EDITORIAL_SESSION_HEADER);

      // A tab that just released its lock may still be told it holds it
      // otherwise, so its own lock never counts
      return c.json(
        session
          ? locks.heldByOther(itemType, id, session)
          : locks.get(itemType, id),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/locks/{itemType}/{id}",
      summary: "Lock an item for editing, or renew the lock",
      request: {
        params: ItemParamsSchema,
        headers: SessionHeadersSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialLockSchema,
            },
          },
          description: "The lock, held by this session",
        },
        404: {
          description: "Item not found",
        },
        423: lockedResponse,
      },
      tags: ["Locks"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    async (c) => {
      const { itemType, id } = c.req.valid("param");

      if (!(await storage.checkItemExists({ type: itemType, id }))) {
        return c.json({ error: "Item not found" }, 404);
      }

      const session = c.req.valid("header")[SESSION_KEY];

      const result = locks.acquire(itemType, id, session, c.get("user"));
      if (!result.acquired) {
        return c.json(
          { error: "Another session is editing the item", lock: result.lock },
          423,
        );
      }

      return c.json(result.lock, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/locks/{itemType}/{id}",
      summary: "Release the lock on an item",
      request: {
        params: ItemParamsSchema,
        headers: SessionHeadersSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.boolean(),
            },
          },
          description: "The lock is released, or wasn't held by this session",
        },
      },
      tags: ["Locks"],
      middleware: [firebaseAuth(config.firebase?.projectId || "")],
      security: [{ bearerAuth: [] }],
    }),
    (c) => {
      const { itemType, id } = c.req.valid("param");
      locks.release(itemType, id, c.req.valid("header")[SESSION_KEY]);
      return c.json(true, 200);
    },
  );

  return app;
}
