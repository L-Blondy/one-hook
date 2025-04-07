import { execSync } from 'child_process'
import { getAllPackageJsonPaths, readPackageJson } from './package-json-utils'
import path from 'path'
import consola from 'consola'

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
          'pnpm run build',
          'pnpm run test',
          `pnpm publish --access public --tag ${tag} --no-git-checks`,
          `npm dist-tag add ${packageJson.name}@${packageJson.version} ${tag}`,
        ].join(' && '),
      )
      consola.success(`RELEASED: v${packageJson.version} ${tag} - ${shortName}`)
    } catch (_) {
      execSync(
        `npm dist-tag add ${packageJson.name}@${packageJson.version} ${tag}`,
      )
      consola.fail(`FAILED  : v${packageJson.version} ${tag} - ${shortName}`)
    }
  }),
)
