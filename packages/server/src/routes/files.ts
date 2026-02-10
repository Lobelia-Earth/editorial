import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  EditorialFilesResponseSchema,
  type EditorialConfig,
  type EditorialFile,
  type EditorialFiles,
  type LargeFileHandler,
} from "@isardsat/editorial-common";
import { readdirSync, statSync } from "node:fs";
import { access, constants, mkdir, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, normalize, relative } from "node:path";

export async function createFilesRoutes(config: EditorialConfig) {
  const app = new OpenAPIHono();

  // Dynamically import the ES module and call its init function
  const hookScript = join(process.cwd(), "editorial", "largeFileHandler");
  const largeFilesHandler: LargeFileHandler = await import(
    `${hookScript}.mjs`
  ).then((mod) => mod.init());

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
            const relativePath = relative(publicDirPath, filePath);

            return {
              name: basename(fileName),
              path: isDirectory ? relativePath : `${origin}/${relativePath}`,
              relativePath: relativePath,
              size: file.size,
              type: isDirectory ? "directory" : "file",
              children: isDirectory
                ? readDirectoryChildren(join(path, fileName))
                : undefined,
            } satisfies EditorialFile;
          })
          .toSorted((a, b) => {
            if (a.type === "directory" && b.type !== "directory") return -1;
            if (a.type !== "directory" && b.type === "directory") return 1;

            return a.name.localeCompare(b.name);
          });
      }

      function mergeDirectoryTrees(
        localFiles: EditorialFiles,
        largeFiles: EditorialFiles,
      ): EditorialFiles {
        const merged: EditorialFiles = [...localFiles];

        for (const largeFile of largeFiles) {
          const existingIndex = merged.findIndex(
            (file) => file.name === largeFile.name && file.type === "directory",
          );

          if (
            existingIndex !== -1 &&
            merged[existingIndex].type === "directory"
          ) {
            // Merge directories with same name
            const existingDir = merged[existingIndex];
            merged[existingIndex] = {
              ...existingDir,
              children: mergeDirectoryTrees(
                existingDir.children || [],
                largeFile.children || [],
              ),
            };
          } else {
            // Add new file/directory
            merged.push(largeFile);
          }
        }

        return merged.toSorted((a, b) => {
          if (a.type === "directory" && b.type !== "directory") return -1;
          if (a.type !== "directory" && b.type === "directory") return 1;

          return a.name.localeCompare(b.name);
        });
      }

      const files = readDirectoryChildren(publicDirPath);
      const largeFiles = await largeFilesHandler.list();
      const mergedFiles = mergeDirectoryTrees(
        files,
        largeFiles as EditorialFiles,
      );
      const totalSize = calculateTotalSize(mergedFiles);

      return c.json({ files: mergedFiles, totalSize });
    },
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
                // relative to publicDirPath, e.g. "images/2026/a.png" or "images/2026"
                path: z.string(),
              }),
            },
          },
          required: true,
        },
      },
      responses: {
        200: {
          content: { "application/json": { schema: z.boolean() } },
          description: "Deleted (moved to deleted folder)",
        },
        400: {
          content: {
            "application/json": { schema: z.object({ error: z.string() }) },
          },
          description: "Invalid file path",
        },
        404: {
          content: {
            "application/json": { schema: z.object({ error: z.string() }) },
          },
          description: "File not found",
        },
        500: {
          content: {
            "application/json": { schema: z.object({ error: z.string() }) },
          },
          description: "Server error",
        },
      },
    }),
    async (c) => {
      const { path: relativePathInput } = c.req.valid("json");

      try {
        const rel = normalize(relativePathInput).replace(/^([/\\])+/, "");

        const absoluteSource = normalize(join(publicDirPath, rel));

        const publicRoot = normalize(
          publicDirPath + (publicDirPath.endsWith("/") ? "" : "/"),
        );
        if (!absoluteSource.startsWith(publicRoot)) {
          return c.json({ error: "Invalid file path" }, 400);
        }

        const exists = await access(absoluteSource, constants.F_OK)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          return c.json({ error: "File not found" }, 404);
        }

        const absoluteTarget = normalize(join(deletedDirPath, rel));

        await mkdir(dirname(absoluteTarget), { recursive: true });
        await rename(absoluteSource, absoluteTarget);

        return c.json(true, 200);
      } catch (err) {
        console.error("Delete failed:", err);
        return c.json({ error: "Server error" }, 500);
      }
    },
  );
  app.openapi(
    createRoute({
      method: "put",
      path: "/files",
      request: {
        body: {
          content: {
            "multipart/form-data": {
              schema: z.object({
                path: z.string().optional(),
                files: z.any(),
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
              schema: z.string().array(),
            },
          },
          description: "Files uploaded successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Invalid request",
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
      try {
        const body = await c.req.parseBody();
        const targetPath = (body.path as string) || "";
        const files = body.files as File | File[];

        if (!files) {
          return c.json({ error: "No files provided" }, 400);
        }

        const fileArray = Array.isArray(files) ? files : [files];
        const uploadedFiles: string[] = [];

        const targetDir = join(publicDirPath, targetPath);
        const normalizedTargetDir = normalize(targetDir);

        if (!normalizedTargetDir.startsWith(publicDirPath)) {
          return c.json({ error: "Invalid target path" }, 400);
        }

        await mkdir(normalizedTargetDir, { recursive: true });

        for (const file of fileArray) {
          if (file instanceof File) {
            if (file.size >= 1e6) {
              await largeFilesHandler.upload(file, { path: targetPath });
              uploadedFiles.push(file.name);
              continue;
            }

            const fileName = file.name;
            const filePath = join(normalizedTargetDir, fileName);
            const buffer = await file.arrayBuffer();

            await writeFile(filePath, new Uint8Array(buffer));
            uploadedFiles.push(fileName);
          }
        }

        return c.json(uploadedFiles, 200);
      } catch (err) {
        console.error("Upload failed:", err);
        return c.json({ error: "Server error" }, 500);
      }
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/files/directory",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                // path relative to publicDirPath, e.g. "images/2026"
                path: z.string().optional().default(""),
                // directory name to create, e.g. "new-folder"
                name: z.string().min(1),
              }),
            },
          },
          required: true,
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: z.object({
                relativePath: z.string(),
              }),
            },
          },
          description: "Directory created",
        },
        400: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Invalid directory path/name",
        },
        409: {
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
          description: "Directory already exists",
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
      try {
        const { path, name } = c.req.valid("json");

        // Avoid path traversal and invalid names
        if (
          name.includes("/") ||
          name.includes("\\") ||
          name === "." ||
          name === ".."
        ) {
          return c.json({ error: "Invalid directory name" }, 400);
        }

        const targetDir = join(publicDirPath, path ?? "", name);
        const normalizedTargetDir = normalize(targetDir);

        if (!normalizedTargetDir.startsWith(publicDirPath)) {
          return c.json({ error: "Invalid directory path" }, 400);
        }

        const exists = await access(normalizedTargetDir, constants.F_OK)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          return c.json({ error: "Directory already exists" }, 409);
        }

        await mkdir(normalizedTargetDir, { recursive: true });

        const relativePath = relative(publicDirPath, normalizedTargetDir);
        return c.json({ relativePath }, 201);
      } catch (err) {
        console.error("Create directory failed:", err);
        return c.json({ error: "Server error" }, 500);
      }
    },
  );

  return app;
}
