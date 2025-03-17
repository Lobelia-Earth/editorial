import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function createPackageJSON(directory: string, version: string) {
  const packageJson = {
    name: "example-editorial-app",
    version: "0.0.1",
    private: true,
    dependencies: {
        "@isardsat/editorial-cli": version,
    },
    devDependencies: {},
  };

  await writeFile(join(directory, "package.json"), JSON.stringify(packageJson, null, 2));
}