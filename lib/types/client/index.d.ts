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
/** Required services: settings transport plus slots/locale for the skin row. */
export declare const inject: string[];
/**
 * Client plugin body: provide the skin-manager service and register the
 * General-section skin row.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
