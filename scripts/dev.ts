#!/usr/bin/env bun

import { execSync } from 'child_process'
import { consola } from 'consola'

function main() {
  const packageName = process.argv[2]

  if (!packageName) {
    consola.error(
      'Please provide a package name.\nExample: pnpm run dev <package-name>',
    )
    process.exit(1)
  }

  // Ensure package name starts with "use-" if it doesn't already
  const fullPackageName =
    packageName === 'utils'
      ? 'utils'
      : packageName.startsWith('use-')
        ? packageName
        : `use-${packageName}`

  try {
    const command = `pnpm run align && cd ./packages/${fullPackageName} && pnpm dev`
    consola.info(`Running: ${command}`)
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    consola.error('Command failed:', error)
    process.exit(1)
  }
}

main()
