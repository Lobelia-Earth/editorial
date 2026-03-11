import { type EditorialVersionResponse } from "@isardsat/editorial-common";
import pkg from "../../../package.json" with { type: "json" };

const CURRENT_VERSION = pkg.version;
let latestVersionCache: string | null = null;
let lastChecked = 0;

type NpmRegistryMetadata = {
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  versions: Record<string, any>;
};

export async function getCurrentAndLatestVersion(): Promise<EditorialVersionResponse> {
  const now = Date.now();
  if (latestVersionCache && now - lastChecked < 60_000 * 10) {
    // cache 10 min
    return { current: CURRENT_VERSION, latest: latestVersionCache };
  }

  try {
    const res = await fetch(
      "https://registry.npmjs.org/@isardsat/editorial-admin",
      { headers: { Accept: "application/vnd.npm.install-v1+json" } },
    );
    const data = (await res.json()) as NpmRegistryMetadata;
    latestVersionCache = data["dist-tags"].latest;
    lastChecked = now;
    return { current: CURRENT_VERSION, latest: latestVersionCache };
  } catch {
    throw new Error("Failed to fetch latest version from npm registry");
  }
}
