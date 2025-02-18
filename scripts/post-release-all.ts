/* eslint-disable */
import { execSync } from "child_process";

try {
  execSync("git commit -a -m 'release'");
  execSync("git push");
} catch (_) {
  console.info("git: nothing to add, nothing to push.");
}
