/* eslint-disable */
import { execSync } from "child_process";
import path from "path";

const releaseTypes = ["stable", "beta"] as const;
export type ReleaseType = (typeof releaseTypes)[number];

export async function preRelease(type: string | undefined) {
  execSync("git pull");
  await checkReleaseType(type as ReleaseType);
  execSync("pnpm run test");
  execSync("pnpm run build");
}

async function checkReleaseType(type: ReleaseType | undefined) {
  if (!type || !releaseTypes.includes(type)) {
    throw new Error(
      `Version type must be one of ${JSON.stringify(releaseTypes)}. Received ${JSON.stringify(type)}.`
    );
  }
  const packageJson = (await import(
    path.join(process.cwd(), "package.json")
  )) as Record<string, any>;
  const version = packageJson.version;
  if (!version) {
    throw new Error("package.json has no version.");
  }

  const isInvalidBeta = type === "beta" && !version.includes(type);
  const isInvalidStable =
    type === "stable" && (version.includes("beta") || version.includes("-"));
  if (isInvalidBeta || isInvalidStable) {
    throw new Error(
      `Invalid package.json "version" field for a "${type}" release.`
    );
  }
}
