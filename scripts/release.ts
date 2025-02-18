import { execSync } from "child_process";
import { preRelease, type ReleaseType } from "./pre-release";
import { postRelease } from "./post-release";

const releaseType = process.argv[2] as ReleaseType | undefined;

await preRelease(releaseType);

if (releaseType === "beta") {
  execSync("pnpm publish --tag beta");
} else {
  execSync("pnpm publish");
}

postRelease();
