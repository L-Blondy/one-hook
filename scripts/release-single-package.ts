import { execSync } from "child_process";
import { getReleaseTag } from "./get-release-tag";

const tag = await getReleaseTag();
execSync("pnpm run build");
execSync("pnpm run test");

if (tag) {
  execSync(`pnpm publish --tag ${tag}`);
} else {
  execSync("pnpm publish");
}
