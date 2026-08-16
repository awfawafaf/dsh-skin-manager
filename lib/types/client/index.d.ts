import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SkinManagerKey } from './locales.ts';
/** Namespace owning this feature's settings-row copy. */
export declare const SETTINGS_NS = "settings.skin-manager";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The skin preference row's copy. */
        'settings.skin-manager': SkinManagerKey;
    }
}
export { CLASSIC_SKIN, SkinManagerRuntime } from './skin-manager.ts';
export type { SkinManagerSnapshot } from '../skin-contract.ts';
export type { SettingsAppearanceItemOwnerProps } from './appearance-section.tsx';
/** Required services: slots/locale for the skin row (the preference rides
 * the plugin's own host route, not the settings BFF). */
export declare const inject: string[];
/**
 * Client plugin body: provide the skin-manager service and register the
 * Appearance-section skin row.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
