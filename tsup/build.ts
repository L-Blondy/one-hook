import { type Options } from "tsup";

export const tsupBuildConfig = (
  entry: Options["entry"] = { index: "./src/index.ts" }
): Options => ({
  entry,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "dist",
  treeshake: true,
  tsconfig: "./tsconfig.json",
});
