/* eslint-disable */
import path from "path";
import fs from "fs";
import consola from "consola";
import { outDir } from "../tsup/build";
import { getPackageJson, type PackageJson } from "./get-package-json";

export async function updateSinglePackageJson() {
  const packageJson = await getPackageJson();
  await setScripts(packageJson);
  await setExports(packageJson);
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
  consola.success("Exports updated successfully.");
}

async function setScripts(packageJson: PackageJson) {
  packageJson.scripts = {
    build: "NODE_ENV=production tsup",
    dev: 'concurrently "tsup --watch" "vitest"',
    test: "vitest run && tsc --noEmit",
    lint: "eslint . && tsc --noEmit",
    "lint:eslint": "eslint .",
    "lint:typescript": "tsc --noEmit",
    release: "bun ../../scripts/release-single-package.ts",
  };
}

async function setExports(packageJson: PackageJson) {
  type PackageExports = NonNullable<typeof packageJson.exports>;
  const { buildConfig } = await import(
    path.join(process.cwd(), "tsup.config.ts")
  );
  const entry: Record<string, string> = Array.isArray(buildConfig)
    ? buildConfig[0].entry
    : buildConfig.entry;

  packageJson.exports = Object.keys(entry).reduce(
    (acc, name) => {
      acc[name === "index" ? "." : `./${name}`] = {
        types: `./${outDir}/${name}.d.ts`,
        default: `./${outDir}/${name}.js`,
      };
      return acc;
    },
    { "./package.json": "./package.json" } as PackageExports
  );
}
