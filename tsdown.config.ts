import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('dsh-skin-manager', ['src/index.ts'], {
  portableCssModuleIds: true,
  libExternal: ['@deepseek-ai/dsh-settings', '@deepseek-ai/schemastery'],
})
