import 'server-only'
import rootPackageJson from '../../../package.json' with { type: 'json' }

export function repoUrl() {
  return rootPackageJson.repository.url
}
