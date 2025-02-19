/* eslint-disable @typescript-eslint/no-unused-vars */
import { execSync } from "child_process";
import { getAllPackageJsonPaths, readPackageJson } from "./package-json-utils";
import path from "path";
import consola from "consola";

// before all
execSync("pnpm run align");
execSync("git pull");

// release all
await Promise.all(
  getAllPackageJsonPaths("./packages").map((packageJsonPath) => {
    const packagePath = path.join(packageJsonPath, "..");
    const packageJson = readPackageJson(packageJsonPath);
    const shortName = packageJson.name.replace("@rebase.io/", "");
    const tag = packageJson.version.replace(/[.\-0-9]/g, "");

    try {
      execSync(
        [
          `cd ${packagePath}`,
          "pnpm run build",
          "pnpm run test",
          tag
            ? `pnpm publish --access public --tag ${tag}`
            : `pnpm publish --access public`,
        ].join(" && ")
      );
      consola.box(
        `✔ Successfully published package:\n  - ${shortName}\n  - ${packageJson.version}`
      );
    } catch (_) {
      consola.box(
        `✖ Nothing published for package:\n  - ${shortName}\n  - ${packageJson.version}`
      );
    }
  })
);

// after all
try {
  execSync("git add .");
  execSync("git commit -m 'release'");
  execSync("git push");
} catch (_) {
  consola.info("git: nothing to add, nothing to push.");
}
