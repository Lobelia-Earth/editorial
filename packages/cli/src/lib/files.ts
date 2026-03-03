import { writeFile } from "node:fs/promises";

export async function createFileIfNotExists(filePath: string, content: string) {
  try {
    await writeFile(filePath, content, { flag: "wx" });
    console.log(`Created ${filePath}`);
  } catch (err: any) {
    if (err.code === "EEXIST") {
      console.log(`${filePath} already exists, skipping`);
    } else {
      throw err;
    }
  }
}
