import { type Options } from "tsup";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outDir = "dist";
const minExtension = ".min.js";

export const tsupBuildOptions = (
  entry: Options["entry"] = { index: "./src/index.ts" }
): Options[] => {
  const buildOptions: Options = {
    entry,
    sourcemap: true,
    dts: true,
    minify: false,
    clean: process.env.NODE_ENV === "production",
    format: ["esm"],
    outDir,
    treeshake: true,
    tsconfig: "./tsconfig.json",
  };

  const gzipOptions: Options = {
    ...buildOptions,
    sourcemap: false,
    dts: false,
    minify: true,
    outExtension: () => ({
      js: minExtension,
    }),
    async onSuccess() {
      const files = (await fs.promises.readdir(outDir)).filter((file) =>
        file.endsWith(minExtension)
      );
      await Promise.all(
        files.map(async (file) => {
          await toGzip(file);
          await deleteFile(file);
        })
      );
    },
  };
  return process.env.NODE_ENV === "production"
    ? [buildOptions, gzipOptions]
    : [buildOptions];
};

async function toGzip(fileName: string) {
  // Input and output file paths
  const inputFile = path.join(process.cwd(), outDir, fileName);
  const outputFile = path.join(process.cwd(), outDir, `${fileName}.gz`); // The gzipped output file

  // Check if the input file exists
  await fs.promises.access(inputFile, fs.constants.F_OK);

  return new Promise<void>((resolve, reject) => {
    // Create a readable stream from the input file
    const input = fs.createReadStream(inputFile);

    // Create a writable stream for the compressed output file
    const output = fs.createWriteStream(outputFile);

    // Pipe the input stream through gzip and then to the output stream
    input.pipe(zlib.createGzip()).pipe(output);

    output.on("finish", () => {
      console.log(`File successfully gzipped to "${outputFile}"`);
      resolve();
    });

    output.on("error", (error) => {
      reject(error);
    });

    input.on("error", (error) => {
      reject(error);
    });
  });
}

async function deleteFile(fileName: string) {
  const inputFile = path.join(process.cwd(), "dist", fileName);
  await fs.promises.unlink(inputFile);
}
