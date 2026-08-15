import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
//#region src/skin-settings.ts
/** Skin settings stored in the Host user-settings document. */
/** Settings namespace owned by the skin manager. */
const SKIN_SETTINGS_NAMESPACE = "skin-manager";
/** Field carrying the active skin id. */
const SKIN_SETTINGS_FIELD = "skin";
/** Default skin when the user-settings document has no override. */
const DEFAULT_SKIN = "classic";
/** Durable skin schema; also the wire envelope the browser scope validates against. */
const SkinSettingsSchema = z.object({ [SKIN_SETTINGS_FIELD]: z.string().default(DEFAULT_SKIN) });
//#endregion
//#region src/index.ts
const SKIN_NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE);
/**
* Register the durable skin section with the Host settings service when it
* is composed. The browser half binds the same namespace through
* `ctx.settingsScope`.
* @param ctx - Host context that may acquire the settings service.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(SKIN_NAMESPACE, SkinSettingsSchema);
	});
}
//#endregion
export { DEFAULT_SKIN, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE, apply };
