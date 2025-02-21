import {
  getAllPackageJsonPaths,
  getExports,
  updatePackageJson,
} from './package-json-utils'

const allPaths = getAllPackageJsonPaths('./packages')

await Promise.all(
  allPaths.map(async (path) => {
    const exports = await getExports(path)

    updatePackageJson(path, (json) => ({
      ...json,
      exports,
      type: 'module',
      files: Array.from(new Set(['dist', 'README.md', ...(json.files ?? [])])),
      scripts: {
        build: 'NODE_ENV=production tsup',
        dev: 'concurrently "tsup --watch" "vitest"',
        test: 'vitest run && tsc --noEmit',
        lint: 'eslint . && tsc --noEmit',
        'lint:eslint': 'eslint .',
        'lint:typescript': 'tsc --noEmit',
      },
      peerDependencies: json.name.includes('/utils')
        ? undefined
        : {
            '@types/react': '>=18.0.0 || >=19.0.0',
            '@types/react-dom': '>=18.0.0 || >=19.0.0',
            react: '>=18.0.0 || >=19.0.0',
            'react-dom': '>=18.0.0 || >=19.0.0',
          },
    }))
  }),
)
