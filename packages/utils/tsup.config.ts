import { defineConfig, type Options } from "tsup";

export const tsupConfig: Options = {
  entry: {
    index: "./src/index.ts",
  },
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "dist",
  treeshake: true,
};

export default defineConfig(tsupConfig);
