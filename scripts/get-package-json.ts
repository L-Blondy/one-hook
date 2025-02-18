/* eslint-disable */
import path from "path";
import * as v from "valibot";

const validTags = ["", "beta"] as const;
type ValidTag = (typeof validTags)[number];

const schema = v.looseObject({
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

export async function getPackageJson() {
  const packageJson = (await import(path.join(process.cwd(), "package.json")))
    .default;
  return v.parse(
    v.pipe(
      schema,
      v.transform((data) => {
        const tag = data.version.replace(/[.\-0-9]/g, "") as ValidTag;
        if (!validTags.includes(tag)) {
          throw new Error(
            `Invalid version tag for package ${data.name}@${data.version}`
          );
        }
        return { tag, ...data };
      })
    ),
    packageJson
  );
}

export type PackageJson = Awaited<ReturnType<typeof getPackageJson>>;
