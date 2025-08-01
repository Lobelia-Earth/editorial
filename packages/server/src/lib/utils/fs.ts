import { access, constants, copyFile, rename, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, dirname, join } from "path";

/**
 * This function writes a file in as atomic a way as possible. It first creates
 * a backup of the file to be written to, writes new content to a temporary
 * file, and finally renames the temporary file to the final name.
 */
export async function writeFileSafe(file: string, contents: string) {
  const fileName = basename(file);
  const destination = join(dirname(file), `${fileName}.${Date.now()}.tmp`);

  try {
    try {
      await access(file, constants.F_OK);
      await copyFile(file, join(tmpdir(), fileName));
    } catch {
      // File doesn't exist, skip backup
    }

    await writeFile(destination, contents);
    await rename(destination, file);
  } catch (error) {
    throw error;
  }
}
