/* eslint-disable */
import { execSync } from "child_process";
import consola from "consola";

try {
  execSync("git add .");
  execSync("git commit -m 'release'");
  execSync("git push");
} catch (_) {
  consola.info("git: nothing to add, nothing to push.");
}
