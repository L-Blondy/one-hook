import { defineConfig, type Options } from "tsup";

export const tsupConfig: Options = {
  entry: {
    index: "./index.ts",
  },
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "dist",
  treeshake: true, // rollup
};

export default defineConfig(tsupConfig);
