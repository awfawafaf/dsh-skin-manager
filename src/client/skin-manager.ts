/**
 * Browser skin registry and preference owner. Exactly one skin is active at
 * a time; the manager calls the active skin's apply() and holds its disposer
 * until the skin loses active state or the manager fiber disposes. The
 * choice persists through the Host settings scope; the built-in `classic`
 * skin is the DSH stock look (apply = no-op).
 */
import type { Context } from '@deepseek-ai/cordis'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinDefinition, SkinManagerSnapshot, SkinView } from '../skin-contract.ts'
import { DEFAULT_SKIN, SKIN_SETTINGS_FIELD, type SkinSettings } from '../skin-settings.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Skin registry and preference owner. */
    skinManager: SkinManagerRuntime
  }
  interface Events {
    /**
     * Skin state changed (active skin switched or the registry updated).
     * @param snapshot - Current immutable skin-manager snapshot.
     * @mode emit
     */
    'skinManager/change'(snapshot: SkinManagerSnapshot): void
  }
}

/** The built-in skin representing the DSH stock look. */
export const CLASSIC_SKIN: SkinDefinition = Object.freeze({
  id: 'classic',
  label: '经典',
  labelEn: 'Classic',
  apply: () => () => {},
})

/**
 * Skin registry and preference owner.
 *
 * Reads go through {@link getSnapshot}; preference writes only through
 * {@link setSkin}; continuous sync only through the `skinManager/change`
 * event. A persisted id that is not yet registered stays pending: the moment
 * a skin with that id registers, it is applied (covers boot ordering and
 * skin reinstalls).
 */
export class SkinManagerRuntime {
  private readonly ctx: Context
  private readonly host: SettingsScope<SkinSettings>
  private readonly definitions = new Map<string, SkinDefinition>()
  private preferred = DEFAULT_SKIN
  /** Empty until the constructor applies the default skin (never a registered id). */
  private active = ''
  private revision = 0
  private snapshot: SkinManagerSnapshot
  private activeDispose: (() => void) | undefined

  /**
   * @param ctx - owning context (change events are emitted on it; the
   * settings-scope listener is released through ctx.effect on dispose).
   * @param host - durable preference scope owned by the same plugin.
   */
  constructor(ctx: Context, host: SettingsScope<SkinSettings>) {
    this.ctx = ctx
    this.host = host
    this.definitions.set(CLASSIC_SKIN.id, CLASSIC_SKIN)
    // Stamp the stock-look baseline so `body[data-ds-skin="classic"]` holds
    // from the first paint; the invariant is "the active skin is applied".
    this.apply(DEFAULT_SKIN)
    this.snapshot = this.buildSnapshot()
    ctx.effect(() => host.subscribe(() => { this.adopt() }), 'dsh-skin-manager: settings scope adoption')
    this.adopt()
  }

  /**
   * Read the current immutable skin-manager snapshot.
   * @returns the current snapshot (stable reference until the next change).
   */
  getSnapshot(): SkinManagerSnapshot {
    return this.snapshot
  }

  /**
   * Switch the active skin — the only user preference write entry. Every
   * accepted value persists through the settings scope and emits
   * `skinManager/change`.
   * @param id - a registered skin id; unknown ids throw.
   */
  setSkin(id: string): void {
    if (!this.definitions.has(id)) {
      throw new Error(`skin "${id}" is not registered`)
    }
    if (this.preferred === id && this.active === id) return
    this.preferred = id
    void this.host.set(SKIN_SETTINGS_FIELD, id)
    this.apply(id)
    this.publish()
  }

  /**
   * Register a skin. Duplicate ids throw; `classic` is built in and cannot
   * be re-registered. If the persisted preference already names this skin,
   * it is applied immediately.
   * @param skin - the skin definition.
   * @returns disposer. Disposing the skin backing the active preference
   * resets to the default skin (memory only — the settings document keeps
   * the old id until the user picks again).
   */
  register(skin: SkinDefinition): () => void {
    if (skin.id === DEFAULT_SKIN) {
      throw new Error(`"${DEFAULT_SKIN}" is the built-in default skin id`)
    }
    if (this.definitions.has(skin.id)) {
      throw new Error(`skin "${skin.id}" is already registered`)
    }
    this.definitions.set(skin.id, skin)
    if (this.preferred === skin.id && this.active !== skin.id) this.apply(skin.id)
    this.publish()
    return () => {
      if (!this.definitions.has(skin.id)) return
      this.definitions.delete(skin.id)
      if (this.active === skin.id) {
        this.preferred = DEFAULT_SKIN
        this.apply(DEFAULT_SKIN)
      }
      this.publish()
    }
  }

  /**
   * Release the active skin and clear the skin body attribute. Called by the
   * owning fiber's dispose effect.
   */
  dispose(): void {
    this.activeDispose?.()
    this.activeDispose = undefined
    if (typeof document !== 'undefined') delete document.body.dataset.dsSkin
  }

  /** Adopt the scope's durable preference without writing it back. */
  private adopt(): void {
    const section = this.host.getSnapshot().value
    if (section === undefined || section.skin === this.preferred) return
    this.preferred = section.skin
    if (this.definitions.has(section.skin)) this.apply(section.skin)
    this.publish()
  }

  /**
   * Switch the applied skin: dispose the previous skin, stamp the generic
   * `data-ds-skin` body attribute (a CSS-only skin may scope on it), then
   * run the new skin's apply.
   */
  private apply(id: string): void {
    if (this.active === id) return
    this.activeDispose?.()
    this.activeDispose = undefined
    if (typeof document !== 'undefined') document.body.dataset.dsSkin = id
    this.active = id
    this.activeDispose = this.definitions.get(id)?.apply()
  }

  private buildSnapshot(): SkinManagerSnapshot {
    return Object.freeze({
      activeId: this.active,
      skins: Object.freeze([...this.definitions.values()].map(toView)),
      revision: this.revision,
    })
  }

  private publish(): void {
    this.revision += 1
    this.snapshot = this.buildSnapshot()
    this.ctx.emit('skinManager/change', this.snapshot)
  }
}

function toView(skin: SkinDefinition): SkinView {
  return {
    id: skin.id,
    label: skin.label,
    ...(skin.labelEn !== undefined ? { labelEn: skin.labelEn } : {}),
    ...(skin.accent !== undefined ? { accent: skin.accent } : {}),
    ...(skin.order !== undefined ? { order: skin.order } : {}),
  }
}
