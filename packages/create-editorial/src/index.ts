import { Command } from "commander";
import { readFileSync } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPackageJSON } from "./utils/package-json";

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);

export const command = new Command()
  .version(version)
  .argument("[directory]", "root directory for editorial", "./editorial")
  .usage("[directory] [options]")
  .description("Create a new Editorial application")
  .action(async (directory) => {
    console.log("Creating new Editorial application");
    console.log(directory);

    try {
      await access(directory);
      console.error("Directory already exists");
      process.exit(1);
    } catch {
      // Directory doesn't exist, we can proceed
    }

    console.log("Creating directory structure...");
    await mkdir(directory, { recursive: true });
    await mkdir(join(directory, "editorial"), { recursive: true });

    console.log("Creating config.json...");
    const configData = JSON.stringify(
      {
        name: "My Editorial Site",
        publicUrl: "http://localhost:3001/",
        previewUrl: "http://localhost:3001/preview/",
      },
      null,
      2
    );
    await writeFile(join(directory, "editorial", "config.json"), configData);

    console.log("Creating schema.yaml...");
    const schemaData = `# Editorial Schema
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
        displayExtra: 'Write anything you want!'
  `;
    await writeFile(join(directory, "editorial", "schema.yaml"), schemaData);

    console.log("Creating data.json...");
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
      2
    );
    await writeFile(join(directory, "editorial", "data.json"), dataJson);

    console.log("Creating package.json...");
    await createPackageJSON(directory, version);

    console.log("Done!");
  });
