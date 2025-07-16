import { program } from "@commander-js/extra-typings";
import { initCommand } from "./commands/init.js";
import { startCommand } from "./commands/start.js";
import { version } from "./version.js";

export const editorialCli = program
  .name("Editorial")
  .version(version)
  .addCommand(initCommand)
  .addCommand(startCommand, { isDefault: true });
