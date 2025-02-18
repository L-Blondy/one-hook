/* eslint-disable */
import path from "path";

const validTags = ["", "beta"] as const;

export async function getReleaseTag(): Promise<(typeof validTags)[number]> {
  const packageJson = (await import(
    path.join(process.cwd(), "package.json")
  )) as Record<string, any>;
  const version = packageJson.version;
  if (!version) {
    throw new Error("package.json has no version.");
  }

  const tag = version.replace(/[.\-0-9]/g, "");
  if (!validTags.includes(tag as any))
    throw new Error(
      `Invalid version tag for package ${packageJson.name}@${packageJson.version}`
    );
  return tag;
}
