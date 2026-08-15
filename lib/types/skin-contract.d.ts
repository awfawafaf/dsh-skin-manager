/**
 * Skin-manager contract — pure types shared by the Host entry (re-exported
 * for skin authors) and the browser runtime. No runtime code: a skin plugin
 * type-imports {@link SkinDefinition} from the package root and registers
 * through the `skinManager` client service.
 */
/** One selectable skin. */
export interface SkinDefinition {
    /** Stable id (kebab-case); the persisted settings value. */
    id: string;
    /** Display name (Chinese product copy). */
    label: string;
    /** Display name (English). */
    labelEn?: string;
    /** Swatch color for the settings row. */
    accent?: string;
    /** Row ordering (ascending; built-in classic sits first). */
    order?: number;
    /**
     * Activate the skin. Must return a disposer that fully restores the
     * previous look (body attributes, inline styles, injected DOM, stylesheet
     * tags, title/favicon). The manager calls apply() exactly once per
     * activation and the disposer once when the skin loses active state or
     * the manager fiber disposes.
     */
    apply: () => () => void;
}
/** JSON-safe skin row entry (the apply function never crosses the UI boundary). */
export interface SkinView {
    id: string;
    label: string;
    labelEn?: string;
    accent?: string;
    order?: number;
}
/** Immutable skin-manager state published on every change. */
export interface SkinManagerSnapshot {
    /** The active skin id. */
    activeId: string;
    /** Registered skins in registration order (classic first). */
    skins: readonly SkinView[];
    /** Monotonic change counter. */
    revision: number;
}
