/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as v from "valibot";
import fs from "fs";
import path from "path";
import consola from "consola";
import { type Options as TsupOptions } from "tsup";
import ignore from "ignore";

const packageJsonSchema = v.looseObject({
  name: v.string(),
  version: v.string(),
  files: v.optional(v.array(v.string())),
  type: v.optional(v.literal("module")),
  exports: v.optional(
    v.record(
      v.string(),
      v.union([
        v.string(),
        v.object({
          types: v.string(),
          default: v.string(),
        }),
      ])
    )
  ),
  scripts: v.optional(v.record(v.string(), v.string())),
  peerDependencies: v.optional(v.record(v.string(), v.string())),
});

type PackageJson = v.InferOutput<typeof packageJsonSchema>;
type PackageExports = NonNullable<PackageJson["exports"]>;

/**
 * returns an array of paths to all package.json files in the given folder
 */
export function getAllPackageJsonPaths(folder: string) {
  const files = fs
    .readdirSync(folder, { recursive: true })
    .filter((file) => typeof file === "string")
    .filter((file) => file.endsWith("package.json"))
    .map((file) => path.join(folder, file));
  const ig = ignore().add(
    fs.readFileSync(path.join(process.cwd(), ".gitignore")).toString()
  );
  return ig.filter(files);
}

export function readPackageJson(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = v.parse(packageJsonSchema, JSON.parse(content));
  return parsed;
}

export function updatePackageJson(
  filePath: string,
  update: (json: PackageJson) => PackageJson
) {
  const json = readPackageJson(filePath);
  const updated = update(json);
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  consola.success(`Updated successfully: ${filePath}`);
}

export async function getExports(pkgFilePath: string) {
  const tsupconfigFilePath = path.join(
    process.cwd(),
    pkgFilePath,
    "..",
    "tsup.config.ts"
  );
  const _options = (await import(tsupconfigFilePath)).buildOptions;
  const buildOptions: TsupOptions = Array.isArray(_options)
    ? _options[0]
    : _options;

  if (!buildOptions.entry) {
    throw new Error('tsup.config.ts has no "entry" field');
  }
  if (!buildOptions.outDir) {
    throw new Error('tsup.config.ts has no "outDir" field');
  }

  return Object.keys(buildOptions.entry).reduce(
    (acc, name) => {
      acc[name === "index" ? "." : `./${name}`] = {
        types: `./${buildOptions.outDir}/${name}.d.ts`,
        default: `./${buildOptions.outDir}/${name}.js`,
      };
      return acc;
    },
    { "./package.json": "./package.json" } as PackageExports
  );
}
