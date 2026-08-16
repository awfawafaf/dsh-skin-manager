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
/** Route prefix under which the skin settings are served. */
const SETTINGS_ROUTE_PREFIX = "/skin-manager/settings";
/**
* Register the durable skin section and its settings route when the
* services are composed.
* @param ctx - Host context that may acquire the settings and web services.
*/
function apply(ctx) {
	ctx.inject(["settings", "webServer"], (svcCtx) => {
		const settings = svcCtx.settings;
		settings.register(SKIN_NAMESPACE, SkinSettingsSchema);
		svcCtx.effect(() => svcCtx.webServer.register({
			kind: "prefix",
			path: SETTINGS_ROUTE_PREFIX,
			handler: (req, res) => handleSettingsRequest(req, res, settings)
		}), "dsh-skin-manager: settings routes");
	});
}
/** Serve the skin section: GET reads, POST writes one field and re-reads. */
async function handleSettingsRequest(req, res, settings) {
	if (req.method === "GET") {
		res.writeHead(200, {
			"content-type": "application/json",
			"cache-control": "no-store"
		});
		res.end(JSON.stringify(resolvedSkinSection(settings)));
		return;
	}
	if (req.method === "POST") {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		let patch;
		try {
			patch = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		} catch {
			res.writeHead(400);
			res.end();
			return;
		}
		if (typeof patch.field !== "string") {
			res.writeHead(400);
			res.end();
			return;
		}
		try {
			await settings.update(SKIN_NAMESPACE, { [patch.field]: patch.value });
		} catch {
			res.writeHead(500);
			res.end();
			return;
		}
		res.writeHead(200, {
			"content-type": "application/json",
			"cache-control": "no-store"
		});
		res.end(JSON.stringify(resolvedSkinSection(settings)));
		return;
	}
	res.writeHead(404);
	res.end();
}
/** The current resolved section (schema defaults fill an empty document). */
function resolvedSkinSection(settings) {
	try {
		return settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === "skin-manager")?.value ?? {};
	} catch {
		return {};
	}
}
//#endregion
export { DEFAULT_SKIN, SETTINGS_ROUTE_PREFIX, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE, apply };
