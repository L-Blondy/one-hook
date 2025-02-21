import { tsupBuildOptions } from "../../tsup/build";
import { defineConfig } from "tsup";

export const buildOptions = tsupBuildOptions();
export default defineConfig(buildOptions);
