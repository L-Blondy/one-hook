/* eslint-disable */
import { execSync } from "child_process";
import { consola } from "consola";
import { getPackageJson } from "./get-package-json";
import { updateSinglePackageJson } from "./update-single-package-json";

const { tag, shortName, version } = await getPackageJson();
await updateSinglePackageJson();

try {
  execSync("pnpm run build");
  execSync("pnpm run test");

  if (tag) {
    execSync(`pnpm publish --access public --tag ${tag}`);
  } else {
    execSync("pnpm publish --access public");
  }
  consola.box(
    `✔ Successfully published package:\n  - ${shortName}\n  - ${version}`
  );
} catch (_) {
  consola.box(
    `✖ Nothing published for package:\n  - ${shortName}\n  - ${version}`
  );
}
