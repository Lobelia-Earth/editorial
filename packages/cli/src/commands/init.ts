import { Command } from "@commander-js/extra-typings";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

export const initCommand = new Command()
  .name("init")
  .description("initialize files required for Editorial to function")
  .action(async () => {
    console.log("Initializing editorial...");

    // Check if the editorial directory already exists
    if (existsSync("./editorial")) {
      console.log("Editorial directory already exists!");
      return process.exit(1);
    }

    try {
      await mkdir("./editorial", { recursive: true });
      console.log("Created Editorial directory");

      // Create config.json with basic configuration
      const configData = JSON.stringify(
        {
          name: "Editorial",
          publicUrl: "http://localhost:3001/",
          previewUrl: "http://localhost:3001/preview/",
        },
        null,
        2,
      );
      await writeFile(path.join("editorial", "config.json"), configData);
      console.log("Created config.json");

      // Create schema.yaml with a dummy schema
      const schemaData = `
      # ----------------------------------- Editorial Meta Schema YAML File ------------------------------------
      # If you are using an editor that supports JSON Schema, you can use the following URL 
      # to get validation and autocompletion based on the Editorial meta-schema. 
      # For example, VSCode with redhat.vscode-yaml extension should work out of the box.
      # Make sure to replace "localhost:3001" with the actual address of your Editorial if it's different.
      # Don't uncomment the line below, it is required for the editor to recognize the schema.
      # yaml-language-server: $schema=http://localhost:3001/api/v1/meta-schema?allowedExtraFields=dontTranslate
      #----------------------------------------------------------------------------------------------------------

      
      # Editorial Schema
dummy:
  displayName: Dummy Object
  fields:
    title:
      type: string
      displayName: Title
      showInSummary: true
    body:
      type: markdown
      displayName: Body
      displayExtra: "Write anything you want!"
`;

      await writeFile(path.join("editorial", "schema.yaml"), schemaData);
      console.log("Created schema.yaml");

      // Create data.json with test object
      const dataJson = JSON.stringify(
        {
          dummy: {
            "test-1": {
              id: "test-1",
              title: "Test Object",
              body: "This is a **test** object",
            },
          },
        },
        null,
        2,
      );
      await writeFile(path.join("editorial", "data.json"), dataJson);
      console.log("Created data.json");

      await mkdir(path.join("public"), { recursive: true });
      console.log("Created files directory");

      console.log("Editorial initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize Editorial:", error);
      process.exit(1);
    }
  });
