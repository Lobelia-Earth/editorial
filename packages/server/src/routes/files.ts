import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EditorialFilesResponseSchema,
  type EditorialConfig,
  type EditorialFile,
  type EditorialFiles,
} from "@isardsat/editorial-common";
import { readdirSync, statSync } from "node:fs";
import { access, constants, mkdir, rename } from "node:fs/promises";
import { basename, join, normalize, relative } from "node:path";

export function createFilesRoutes(config: EditorialConfig) {
  const app = new OpenAPIHono();

  const publicFilesUrl = config.filesUrl;

  const publicDirPath = config.publicDir;
  const deletedDirPath = config.publicDeletedDir;

  app.openapi(
    createRoute({
      method: "get",
      path: "/files",
      request: {
        query: z.object({
          preview: z.string().optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: EditorialFilesResponseSchema,
            },
          },
          description: "Get tree of public files with total size",
        },
      },
    }),
    // TODO: Index large files from bucket.
    async (c) => {
      const { preview } = c.req.valid("query");
      const origin = preview ? new URL(c.req.url).origin : publicFilesUrl;

      function calculateTotalSize(files: EditorialFiles): number {
        return files.reduce((total, file) => {
          if (file.type === "file") {
            return total + file.size;
          } else if (file.children) {
            return total + calculateTotalSize(file.children);
          }
          return total;
        }, 0);
      }

      function readDirectoryChildren(path: string): EditorialFiles {
        // TODO: Gracefully handle missing directory?
        const directory = readdirSync(path);

        return directory
          .filter((fileName) => !fileName.startsWith("."))
          .map((fileName) => {
            const file = statSync(join(path, fileName));
            const filePath = join(path, fileName);
            const isDirectory = file.isDirectory();

            return {
              name: basename(fileName),
              path: `${origin}/${relative(publicDirPath, filePath)}`,
              size: file.size,
              type: isDirectory ? "directory" : "file",
              children: isDirectory
                ? readDirectoryChildren(join(path, fileName))
                : undefined,
            } satisfies EditorialFile;
          })
          .sort((a, b) => (a.type === "directory" ? -1 : 0));
      }

      const files = readDirectoryChildren(publicDirPath);
      const totalSize = calculateTotalSize(files);

      return c.json({ files, totalSize });
    }
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/files",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                path: z.string(),
              }),
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.boolean(),
            },
          },
          description: "",
        },
        400: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Invalid file path",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "File not found",
        },
        500: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Server error",
        },
      },
    }),
    async (c) => {
      const { path: filePath } = c.req.valid("json");

      try {
        const normalizedPath = normalize(filePath);

        if (!normalizedPath.startsWith(publicDirPath)) {
          return c.json({ error: "Invalid file path" }, 400);
        }

        const exists = await access(filePath, constants.W_OK)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          return c.json({ error: "File not found" }, 404);
        }

        // Move to deleted directory
        await mkdir(deletedDirPath, { recursive: true });
        await rename(filePath, join(deletedDirPath, basename(filePath)));

        return c.json(true, 200);
      } catch (err) {
        console.error("Delete failed:", err);
        return c.json({ error: "Server error" }, 500);
      }
    }
  );

  return app;
}
