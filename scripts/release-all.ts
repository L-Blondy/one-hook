import { execSync } from 'child_process'
import { getAllPackageJsonPaths, readPackageJson } from './package-json-utils'
import path from 'path'
import consola from 'consola'

// release all
await Promise.all(
  getAllPackageJsonPaths('./packages').map((packageJsonPath) => {
    const packagePath = path.join(packageJsonPath, '..')
    const packageJson = readPackageJson(packageJsonPath)
    const shortName = packageJson.name.replace('@one-stack/', '')
    const tag = packageJson.version.replace(/[.\-0-9]/g, '')

    try {
      execSync(
        [
          `cd ${packagePath}`,
          'pnpm run build',
          'pnpm run test',
          tag
            ? `pnpm publish --quiet --access public --tag ${tag}`
            : `pnpm publish --quiet --access public`,
        ].join(' && '),
      )
      consola.success(`RELEASED: v${packageJson.version} - ${shortName}`)
    } catch (_) {
      consola.fail(`FAILED  : v${packageJson.version} - ${shortName}`)
    }
  }),
)
