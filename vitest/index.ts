import react from "@vitejs/plugin-react";
import { ViteUserConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export const vitestConfig = (): ViteUserConfig => {
  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: "jsdom",
      setupFiles: ["../../vitest/setup.ts"],
    },
    base: "./",
  };
};
