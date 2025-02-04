import { program } from '@commander-js/extra-typings';
import { startCommand } from './commands/start.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { version } = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf-8')
);

export const editorialCli = program
  .name('Editorial')
  .version(version)
  .addCommand(startCommand, { isDefault: true });
