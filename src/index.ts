/** Host registration for the durable skin preference. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { SKIN_SETTINGS_NAMESPACE, SkinSettingsSchema } from './skin-settings.ts'

export {
  DEFAULT_SKIN, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE,
  type SkinSettings,
} from './skin-settings.ts'
export type { SkinDefinition, SkinManagerSnapshot, SkinView } from './skin-contract.ts'

const SKIN_NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE)

/**
 * Register the durable skin section with the Host settings service when it
 * is composed. The browser half binds the same namespace through
 * `ctx.settingsScope`.
 * @param ctx - Host context that may acquire the settings service.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(SKIN_NAMESPACE, SkinSettingsSchema)
  })
}
