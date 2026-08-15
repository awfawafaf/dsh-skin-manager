/** Host registration for the durable skin preference. */
import type { Context } from '@deepseek-ai/cordis';
export { DEFAULT_SKIN, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE, type SkinSettings, } from './skin-settings.ts';
export type { SkinDefinition, SkinManagerSnapshot, SkinView } from './skin-contract.ts';
/**
 * Register the durable skin section with the Host settings service when it
 * is composed. The browser half binds the same namespace through
 * `ctx.settingsScope`.
 * @param ctx - Host context that may acquire the settings service.
 */
export declare function apply(ctx: Context): void;
