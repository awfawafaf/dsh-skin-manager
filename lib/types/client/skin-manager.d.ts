/**
 * Browser skin registry and preference owner. Exactly one skin is active at
 * a time; the manager calls the active skin's apply() and holds its disposer
 * until the skin loses active state or the manager fiber disposes. The
 * choice persists through the Host settings scope; the built-in `classic`
 * skin is the DSH stock look (apply = no-op).
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { SkinDefinition, SkinManagerSnapshot } from '../skin-contract.ts';
import { type SkinSettings } from '../skin-settings.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** Skin registry and preference owner. */
        skinManager: SkinManagerRuntime;
    }
    interface Events {
        /**
         * Skin state changed (active skin switched or the registry updated).
         * @param snapshot - Current immutable skin-manager snapshot.
         * @mode emit
         */
        'skinManager/change'(snapshot: SkinManagerSnapshot): void;
    }
}
/** The built-in skin representing the DSH stock look. */
export declare const CLASSIC_SKIN: SkinDefinition;
/**
 * Skin registry and preference owner.
 *
 * Reads go through {@link getSnapshot}; preference writes only through
 * {@link setSkin}; continuous sync only through the `skinManager/change`
 * event. A persisted id that is not yet registered stays pending: the moment
 * a skin with that id registers, it is applied (covers boot ordering and
 * skin reinstalls).
 */
export declare class SkinManagerRuntime {
    private readonly ctx;
    private readonly host;
    private readonly definitions;
    private preferred;
    /** Empty until the constructor applies the default skin (never a registered id). */
    private active;
    private revision;
    private snapshot;
    private activeDispose;
    /**
     * @param ctx - owning context (change events are emitted on it; the
     * settings-scope listener is released through ctx.effect on dispose).
     * @param host - durable preference scope owned by the same plugin.
     */
    constructor(ctx: Context, host: SettingsScope<SkinSettings>);
    /**
     * Read the current immutable skin-manager snapshot.
     * @returns the current snapshot (stable reference until the next change).
     */
    getSnapshot(): SkinManagerSnapshot;
    /**
     * Switch the active skin — the only user preference write entry. Every
     * accepted value persists through the settings scope and emits
     * `skinManager/change`.
     * @param id - a registered skin id; unknown ids throw.
     */
    setSkin(id: string): void;
    /**
     * Register a skin. Duplicate ids throw; `classic` is built in and cannot
     * be re-registered. If the persisted preference already names this skin,
     * it is applied immediately.
     * @param skin - the skin definition.
     * @returns disposer. Disposing the skin backing the active preference
     * resets to the default skin (memory only — the settings document keeps
     * the old id until the user picks again).
     */
    register(skin: SkinDefinition): () => void;
    /**
     * Release the active skin and clear the skin body attribute. Called by the
     * owning fiber's dispose effect.
     */
    dispose(): void;
    /** Adopt the scope's durable preference without writing it back. */
    private adopt;
    /**
     * Switch the applied skin: dispose the previous skin, stamp the generic
     * `data-ds-skin` body attribute (a CSS-only skin may scope on it), then
     * run the new skin's apply.
     */
    private apply;
    private buildSnapshot;
    private publish;
}
