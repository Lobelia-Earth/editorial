import { program } from '@commander-js/extra-typings';
import { startCommand } from './commands/start.js';
import { version } from './version.js';

export const editorialCli = program
  .name('Editorial')
  .version(version)
  .addCommand(startCommand, { isDefault: true });
