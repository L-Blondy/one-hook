/* eslint-disable */
import { execSync } from "child_process";
import { getReleaseTag } from "./get-release-tag";

const tag = await getReleaseTag();
execSync("git pull");
execSync("pnpm run build");
execSync("pnpm run test");

if (tag) {
  execSync(`pnpm publish --tag ${tag}`);
} else {
  execSync("pnpm publish");
}

try {
  execSync("git add .");
  execSync("git push");
} catch (_) {
  console.info("git: nothing to add, nothing to push.");
}
