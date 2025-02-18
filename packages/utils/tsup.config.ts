import { tsupBuildConfig } from "../../tsup/build";
import { defineConfig } from "tsup";

export default defineConfig(
  tsupBuildConfig({
    emitter: "./src/emitter/index.ts",
    "entries-of": "./src/entries-of/index.ts",
    "is-server": "./src/is-server/index.ts",
    "keys-of": "./src/keys-of/index.ts",
    types: "./src/types/index.ts",
    "values-of": "./src/values-of/index.ts",
  })
);
