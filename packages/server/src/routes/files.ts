import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  EditorialFilesSchema,
  type EditorialFiles,
} from '@isardsat/editorial-common';
import { readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

export function createFilesRoutes() {
  const app = new OpenAPIHono();

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
      const publicDirPath = './public';

      function readDirectoryChildren(path: string): EditorialFiles {
        const directory = readdirSync(path);

        return directory.map((fileName) => {
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

  return app;
}
