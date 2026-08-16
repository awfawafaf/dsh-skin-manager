/** Host registration for the durable skin preference, served through the
 * plugin's own settings route: the Web BFF's namespace allowlist does not
 * include third-party namespaces, so this plugin reads and writes its
 * section directly over its own loopback endpoint. */
import type { Context } from '@deepseek-ai/cordis';
export { DEFAULT_SKIN, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE, type SkinSettings, } from './skin-settings.ts';
export type { SkinDefinition, SkinManagerSnapshot, SkinView } from './skin-contract.ts';
/** Route prefix under which the skin settings are served. */
export declare const SETTINGS_ROUTE_PREFIX = "/skin-manager/settings";
/**
 * Register the durable skin section and its settings route when the
 * services are composed.
 * @param ctx - Host context that may acquire the settings and web services.
 */
export declare function apply(ctx: Context): void;
