/** Skin settings stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the skin manager. */
export const SKIN_SETTINGS_NAMESPACE = 'skin-manager'

/** Field carrying the active skin id. */
export const SKIN_SETTINGS_FIELD = 'skin'

/** Default skin when the user-settings document has no override. */
export const DEFAULT_SKIN = 'classic'

/** Durable skin section shared by the Host schema and the browser scope. */
export interface SkinSettings {
  /** Active skin id (a registered skin id, or the fallback default). */
  skin: string
}

/** Durable skin schema; also the wire envelope the browser scope validates against. */
export const SkinSettingsSchema: z<SkinSettings> = z.object({
  [SKIN_SETTINGS_FIELD]: z.string().default(DEFAULT_SKIN),
})
