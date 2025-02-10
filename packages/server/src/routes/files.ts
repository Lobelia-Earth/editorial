import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  EditorialFilesSchema,
  type EditorialFiles,
} from '@isardsat/editorial-common';
import { readdirSync, statSync } from 'node:fs';
import { access, constants, mkdir, rename } from 'node:fs/promises';
import { basename, join, normalize } from 'node:path';

export function createFilesRoutes() {
  const app = new OpenAPIHono();

  const publicDirPath = 'public';
  const deletedDirPath = 'public/.deleted';

  app.openapi(
    createRoute({
      method: 'get',
      path: '/files',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: EditorialFilesSchema,
            },
          },
          description: 'Get tree of public files',
        },
      },
    }),
    async (c) => {
      function readDirectoryChildren(path: string): EditorialFiles {
        const directory = readdirSync(path);

        return directory
          .filter((fileName) => !fileName.startsWith('.'))
          .map((fileName) => {
            const file = statSync(join(path, fileName));
            const isDirectory = file.isDirectory();

            return {
              name: basename(fileName),
              path: join(path, fileName),
              size: file.size,
              type: isDirectory ? 'directory' : 'file',
              children: isDirectory
                ? readDirectoryChildren(join(path, fileName))
                : undefined,
            };
          });
      }

      const files = readDirectoryChildren(publicDirPath);
      return c.json(files);
    }
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/files',
      request: {
        body: {
          content: {
            'application/json': {
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
            'application/json': {
              schema: z.boolean(),
            },
          },
          description: '',
        },
      },
    }),
    async (c) => {
      const { path: filePath } = c.req.valid('json');

      try {
        const normalizedPath = normalize(filePath);

        if (!normalizedPath.startsWith(publicDirPath)) {
          return c.json({ error: 'Invalid file path' }, 400);
        }

        const exists = await access(filePath, constants.W_OK)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          return c.json({ error: 'File not found' }, 404);
        }

        // Move to deleted directory
        await mkdir(deletedDirPath, { recursive: true });
        await rename(filePath, join(deletedDirPath, basename(filePath)));

        return c.json(true, 200);
      } catch (err) {
        console.error('Delete failed:', err);
        return c.json({ error: 'Server error' }, 500);
      }
    }
  );

  return app;
}
