/* eslint-disable */
import { execSync } from "child_process";

try {
  execSync("git add .");
  execSync("git commit -m 'release'");
  execSync("git push");
} catch (_) {
  console.info("git: nothing to add, nothing to push.");
}
