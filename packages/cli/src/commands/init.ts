import { Command } from "@commander-js/extra-typings";
import { mkdir } from "node:fs/promises";
import * as path from "node:path";
import {
  configData,
  dataJson,
  schemaData,
} from "../constants/editorialFiles.js";
import { createFileIfNotExists } from "../lib/files.js";

export const initCommand = new Command()
  .name("init")
  .description("Initialize files required for Editorial to function")
  .action(async () => {
    console.log("Initializing editorial...");

    try {
      await mkdir("./editorial", { recursive: true });
      console.log("Created Editorial directory");

      const files = [
        { path: "editorial/config.json", content: configData },
        { path: "editorial/schema.yaml", content: schemaData },
        { path: "editorial/data.json", content: dataJson },
      ];

      for (const file of files) {
        await createFileIfNotExists(file.path, file.content);
      }

      await mkdir(path.join("public", "editorialFiles"), { recursive: true });
      console.log("Created files directory");

      console.log("Editorial initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize Editorial:", error);
      process.exit(1);
    }
  });
