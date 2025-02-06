import { Command } from '@commander-js/extra-typings';
import { serve } from '@hono/node-server';
import { createEditorialServer } from '@isardsat/editorial-server';

const SRC = 'editorial';
const DEFAULT_PORT = 3000;
const DEFAULT_UPLOAD_FOLDER = '/static/files';
const DEFAULT_LARGE_FILES = 'editorial/largeFiles';
const DEFAULT_CMS_HELPERS = 'editorial/cmsHelpers';

export const startCommand = new Command()
  .name('start')
  .description('start the editorial API server')
  .option('-p, --port <port>', 'port number to use', Number, DEFAULT_PORT)
  .option('--server <path>', 'server module')
  .option('--uploads <path>', 'upload folder', DEFAULT_UPLOAD_FOLDER)
  .option('--large-files <path>', 'large-files module', DEFAULT_LARGE_FILES)
  .option('--cms-helpers <path>', 'CMS helpers module', DEFAULT_CMS_HELPERS)
  .option(
    '--other-locale-dirs [...dirs]',
    'comma-separated relative paths to other Mady locale folders (e.g. libs)',
    []
  )
  .action(async ({ port }) => {
    const editorialServer = await createEditorialServer({});

    serve({
      fetch: editorialServer.app.fetch,
      port,
    });

    console.log(
      `Editorial API running on ${editorialServer.config.publicUrl}:${port}`
    );
    console.log(
      `Admin panel available at ${editorialServer.config.publicUrl}:${port}/admin`
    );
  });
