#!/usr/bin/env node

/* eslint-disable global-require */

import program from 'commander';
import { mainStory, addListener } from 'storyboard';
import consoleListener from 'storyboard-listener-console';
import open from 'better-opn';
import {
  init as initServer,
  saveDataProd,
  saveTranslationsProd,
  start,
} from './httpServer';

addListener(consoleListener);
process.env.OPEN_MATCH_HOST_ONLY = 'true';

const pkg = require('../../package.json'); // Editorial's own package.json

const SRC = 'editorial';
const DEFAULT_PORT = 3000;
const DEFAULT_UPLOAD_FOLDER = '/static/files';
const DEFAULT_LARGE_FILES = 'editorial/largeFiles';
const DEFAULT_CMS_HELPERS = 'editorial/cmsHelpers';

program
  .version(pkg.version)
  .option('-p, --port [port]', 'Port number to use', Number, DEFAULT_PORT)
  .option('--server [path]', 'Server module')
  .option('--uploads [folder]', 'Upload folder', DEFAULT_UPLOAD_FOLDER)
  .option('--large-files [path]', 'Large-files module', DEFAULT_LARGE_FILES)
  .option('--cms-helpers [path]', 'CMS helpers module', DEFAULT_CMS_HELPERS)
  .option('--no-open', 'Do not open web browser on launch')
  .option(
    '--other-locale-dirs [dirs]',
    'Comma-separated relative paths to other Mady locale folders (e.g. libs)',
    ''
  )
  // Some commands
  .option('--migrate-locales-chop', 'Migrate locales, chopping Markdown ones')
  .option('--snapshot', 'Take data snapshot for production, but do not publish')
  .parse(process.argv);

program.otherLocaleDirs = program.otherLocaleDirs
  ? program.otherLocaleDirs.split(',')
  : [];

// =======================================
// Run!
// =======================================
const run = async () => {
  if (program.migrateLocalesChop) {
    require('./chopTranslations'); // already runs
  } else {
    const {
      port,
      server,
      uploads,
      largeFiles,
      cmsHelpers,
      otherLocaleDirs,
    } = program;
    const { version } = pkg;
    await initServer({
      port,
      server,
      uploads,
      largeFiles,
      cmsHelpers,
      otherLocaleDirs,
      version,
      noServer: !!program.snapshot,
    });
    start();
    if (program.snapshot) {
      saveDataProd();
      saveTranslationsProd();
      mainStory.info(SRC, 'Snapshot taken!');
      return;
    }
    if (program.open) {
      try {
        open(`http://localhost:${port}/editorial`);
      } catch (err) {
        mainStory.error(SRC, 'Error opening the browser', { attach: err });
      }
    }
  }
};

run();
