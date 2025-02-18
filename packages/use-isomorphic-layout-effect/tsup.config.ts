import { tsupBuildConfig } from "../../tsup/build";
import { defineConfig } from "tsup";

export const buildConfig = tsupBuildConfig();
export default defineConfig(buildConfig);
