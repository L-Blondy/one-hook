import { tsupBuildOptions } from '../../tsup/build'
import { defineConfig } from 'tsup'

export const buildOptions = tsupBuildOptions({ index: './src/index.tsx' })
export default defineConfig(buildOptions)
