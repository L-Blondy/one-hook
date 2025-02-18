/* eslint-disable */
import path from "path";
import fs from "fs";
import consola from "consola";
import { outDir } from "../tsup/build";
import { getPackageJson } from "./get-package-json";

export async function setSinglePackageExports() {
  const packageJson = await getPackageJson();
  type PackageExports = NonNullable<typeof packageJson.exports>;
  const { buildConfig } = await import(
    path.join(process.cwd(), "tsup.config.ts")
  );
  const entry: Record<string, string> = Array.isArray(buildConfig)
    ? buildConfig[0].entry
    : buildConfig.entry;

  const packageExports = Object.keys(entry).reduce(
    (acc, name) => {
      acc[name === "index" ? "." : `./${name}`] = {
        types: `./${outDir}/${name}.d.ts`,
        default: `./${outDir}/${name}.js`,
      };
      return acc;
    },
    { "./package.json": "./package.json" } as PackageExports
  );
  packageJson.exports = packageExports;
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
  consola.success("Exports updated successfully.");
}
