import { execSync } from "child_process";
import { checkReleaseType, type ReleaseType } from "./check-release-type";

export async function preRelease(type: ReleaseType) {
  execSync("git pull");
  await checkReleaseType(type);
  execSync("pnpm run test");
  execSync("pnpm run build");
}

await preRelease("stable");
