/** Host registration for the durable skin preference, served through the
 * plugin's own settings route: the Web BFF's namespace allowlist does not
 * include third-party namespaces, so this plugin reads and writes its
 * section directly over its own loopback endpoint. */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { SKIN_SETTINGS_NAMESPACE, SkinSettingsSchema } from './skin-settings.ts'

export {
  DEFAULT_SKIN, SKIN_SETTINGS_FIELD, SKIN_SETTINGS_NAMESPACE,
  type SkinSettings,
} from './skin-settings.ts'
export type { SkinDefinition, SkinManagerSnapshot, SkinView } from './skin-contract.ts'

const SKIN_NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE)

/** Route prefix under which the skin settings are served. */
export const SETTINGS_ROUTE_PREFIX = '/skin-manager/settings'

/** Minimal structural face of the Host settings service this plugin needs. */
interface SettingsService {
  register(namespace: ReturnType<typeof settingsNamespace>, schema: unknown): void
  describe(options?: { redactSecrets?: boolean }): Array<{ ns: unknown; value: unknown }>
  update(namespace: ReturnType<typeof settingsNamespace>, patch: object): Promise<void>
}

/**
 * Register the durable skin section and its settings route when the
 * services are composed.
 * @param ctx - Host context that may acquire the settings and web services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings', 'webServer'], (svcCtx) => {
    const settings = svcCtx.settings as unknown as SettingsService
    settings.register(SKIN_NAMESPACE, SkinSettingsSchema)
    svcCtx.effect(() => svcCtx.webServer.register({
      kind: 'prefix',
      path: SETTINGS_ROUTE_PREFIX,
      handler: (req, res) => handleSettingsRequest(req, res, settings),
    }), 'dsh-skin-manager: settings routes')
  })
}

/** Serve the skin section: GET reads, POST writes one field and re-reads. */
async function handleSettingsRequest(
  req: IncomingMessage,
  res: ServerResponse,
  settings: SettingsService,
): Promise<void> {
  if (req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify(resolvedSkinSection(settings)))
    return
  }
  if (req.method === 'POST') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    let patch: { field?: unknown; value?: unknown }
    try {
      patch = JSON.parse(Buffer.concat(chunks).toString('utf8')) as typeof patch
    } catch {
      res.writeHead(400)
      res.end()
      return
    }
    if (typeof patch.field !== 'string') {
      res.writeHead(400)
      res.end()
      return
    }
    try {
      await settings.update(SKIN_NAMESPACE, { [patch.field]: patch.value })
    } catch {
      res.writeHead(500)
      res.end()
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify(resolvedSkinSection(settings)))
    return
  }
  res.writeHead(404)
  res.end()
}

/** The current resolved section (schema defaults fill an empty document). */
function resolvedSkinSection(settings: SettingsService): unknown {
  try {
    const descriptor = settings
      .describe({ redactSecrets: true })
      .find(candidate => String(candidate.ns) === SKIN_SETTINGS_NAMESPACE)
    return descriptor?.value ?? {}
  } catch {
    return {}
  }
}
