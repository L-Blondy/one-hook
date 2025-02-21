import { tsupBuildOptions } from '../../tsup/build'
import { defineConfig } from 'tsup'

export const buildOptions = tsupBuildOptions({
  index: 'src/index.ts',
  'test-utils': 'src/test-utils.ts',
})
export default defineConfig(buildOptions)
