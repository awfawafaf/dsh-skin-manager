/**
 * Browser skin manager: provide the `skinManager` service (registry + active
 * skin + persistence), own the Appearance settings section, and register the
 * feature-owned skin row into its item slot — a feature owns its settings
 * surface.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { SkinRowInjected } from './skin-row.tsx'
import { SkinRow } from './skin-row.tsx'
import { AppearanceSection } from './appearance-section.tsx'
import { createSkinRowStore } from './settings-store.ts'
import { createFetchScope } from './fetch-scope.ts'
import { zh, en, type SkinManagerKey } from './locales.ts'
import { SkinManagerRuntime } from './skin-manager.ts'
import type { SkinManagerSnapshot } from '../skin-contract.ts'
import { SKIN_SETTINGS_NAMESPACE, type SkinSettings } from '../skin-settings.ts'

/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.skin-manager'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The skin preference row's copy. */
    'settings.skin-manager': SkinManagerKey
  }
}

export { CLASSIC_SKIN, SkinManagerRuntime } from './skin-manager.ts'
export type { SkinManagerSnapshot } from '../skin-contract.ts'
// The re-export keeps the Appearance slot declaration in this entry's
// emitted declarations, so consumers' programs pick up the SlotMap merge.
export type { SettingsAppearanceItemOwnerProps } from './appearance-section.tsx'

/** Required services: slots/locale for the skin row (the preference rides
 * the plugin's own host route, not the settings BFF). */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: provide the skin-manager service and register the
 * Appearance-section skin row.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const host = createFetchScope<SkinSettings>('/skin-manager/settings')
  const runtime = new SkinManagerRuntime(ctx, host)
  ctx.provide('skinManager', runtime)
  ctx.effect(() => () => runtime.dispose(), 'dsh-skin-manager: active skin teardown')

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'dsh-skin-manager: settings row dictionaries')
  const t = ctx.locale.bind(SETTINGS_NS)

  // The Appearance section: the skin preference and the custom-background
  // library live here instead of the General section. Registered before the
  // rows so the item slot declaration is on the ledger when they arrive.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'appearance',
    order: 5,
    label: () => t('appearanceNav'),
    locale: SETTINGS_NS,
    children: { 'settings.appearance.item': { kind: 'list', scope: 'root' } },
  }, AppearanceSection))

  const store = createSkinRowStore()
  let bound: BoundActions<typeof store> | undefined
  const sync = (snapshot: SkinManagerSnapshot): void => {
    bound?.sync(snapshot)
  }
  ctx.on('skinManager/change', sync)
  const injected = (actions: BoundActions<typeof store>): SkinRowInjected => {
    bound = actions
    // Re-sync from the getter so no event is lost between registration and
    // first render (the store's revision guard drops stale duplicates).
    sync(runtime.getSnapshot())
    return {
      setSkin: (id) => { runtime.setSkin(id) },
    }
  }
  ctx.slots.inject('settings.appearance.item', () => ctx.slots.register({
    name: 'settings.appearance.item',
    id: 'skin-manager',
    order: 20,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, SkinRow))
}
