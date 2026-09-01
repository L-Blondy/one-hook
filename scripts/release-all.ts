import { execSync } from 'child_process'
import { spawn } from 'bun'
import { getAllPackageJsonPaths, readPackageJson } from './package-json-utils'
import path from 'path'
import consola from 'consola'

consola.info('Building all packages...')
execSync('pnpm run build')

consola.info('Linting all packages...')
execSync('pnpm run lint')

consola.info('Testing all packages...')
execSync('pnpm run test')

// Publish sequentially so authentication prompts can use the terminal.
for (const packageJsonPath of getAllPackageJsonPaths('./packages')) {
  const packagePath = path.join(packageJsonPath, '..')
  const packageJson = readPackageJson(packageJsonPath)
  const shortName = packageJson.name.replace('@1hook/', '')
  const tag = packageJson.version.replace(/[.\-0-9]/g, '') || 'latest'

  try {
    const proc = spawn(
      ['pnpm', 'publish', '--access', 'public', '--tag', tag],
      {
        cwd: packagePath,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
      },
    )
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      throw new Error(`pnpm publish failed with exit code ${exitCode}`)
    }

    consola.success(`RELEASED: v${packageJson.version} ${tag} - ${shortName}`)
  } catch (_) {
    consola.fail(`FAILED  : v${packageJson.version} ${tag} - ${shortName}`)
  }
}
