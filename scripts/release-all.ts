import { execSync } from 'child_process'
import { getAllPackageJsonPaths, readPackageJson } from './package-json-utils'
import path from 'path'
import consola from 'consola'

consola.info('Building all packages...')
execSync('pnpm run build')

consola.info('Linting all packages...')
execSync('pnpm run lint')

consola.info('Testing all packages...')
execSync('pnpm run test')

// release all
await Promise.all(
  getAllPackageJsonPaths('./packages').map((packageJsonPath) => {
    const packagePath = path.join(packageJsonPath, '..')
    const packageJson = readPackageJson(packageJsonPath)
    const shortName = packageJson.name.replace('@1hook/', '')
    const tag = packageJson.version.replace(/[.\-0-9]/g, '') || 'latest'
    try {
      execSync(
        [
          `cd ${packagePath}`,
          `pnpm publish --quiet --access public --tag ${tag} --no-git-checks`,
        ].join(' && '),
      )
      consola.success(`RELEASED: v${packageJson.version} ${tag} - ${shortName}`)
    } catch (_) {
      consola.fail(`FAILED  : v${packageJson.version} ${tag} - ${shortName}`)
    }
  }),
)
