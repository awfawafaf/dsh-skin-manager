// @vitest-environment jsdom
/**
 * Client apply wiring tests: the plugin provides the skinManager service,
 * registers the General-section skin row with the right options, and the
 * injected setSkin face drives the persisted switch end to end.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinDefinition } from '../src/skin-contract.ts'
import { apply, SETTINGS_NS } from '../src/client/index.ts'
import { SkinManagerRuntime } from '../src/client/skin-manager.ts'
import { SKIN_SETTINGS_FIELD, type SkinSettings } from '../src/skin-settings.ts'

interface RowRegistration {
  name: string
  id: string
  order: number
  store: unknown
  locale: string
  inject: (actions: unknown) => { setSkin: (id: string) => void }
}

function fakeHost() {
  let value: SkinSettings | undefined
  const listeners = new Set<() => void>()
  return {
    scope: {
      getSnapshot: () => ({ value }),
      set: async (field: string, next: unknown) => {
        value = { ...(value ?? {}), [field]: next } as SkinSettings
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    read: () => value,
  }
}

function fakeCtx() {
  const provided = new Map<string, unknown>()
  const effects: (() => unknown)[] = []
  const registrations: Array<{ slotName: string; registration: RowRegistration }> = []
  let localeNamespace: string | undefined
  let injectName: string | undefined
  const host = fakeHost()

  const ctx = {
    provide: (key: string, value: unknown) => { provided.set(key, value) },
    on: () => () => {},
    emit: () => {},
    effect: (factory: () => unknown) => { effects.push(factory()) },
    locale: {
      register: (namespace: string) => { localeNamespace = namespace },
      bind: () => (key: string) => key,
    },
    settingsScope: {
      bind: () => host.scope,
    },
    slots: {
      inject: (name: string, factory: () => unknown) => {
        injectName = name
        factory()
      },
      register: (options: RowRegistration) => {
        registrations.push({ slotName: injectName ?? '', registration: options })
        return () => {}
      },
    },
  }

  return {
    ctx: ctx as unknown as ClientContext,
    provided,
    host,
    readRegistrations: () => registrations,
    readLocale: () => localeNamespace,
  }
}

describe('dsh-skin-manager client apply', () => {
  it('declares the public client manifest', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(manifest.dsh.client.platform).toBe('web')
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-runtime')
    expect(manifest.peerDependencies['@deepseek-ai/cordis']).toBe('^4.0.1')
  })

  it('provides the skinManager service, the Appearance section, and the skin row', () => {
    const { ctx, provided, readRegistrations, readLocale } = fakeCtx()
    apply(ctx)

    expect(provided.get('skinManager')).toBeInstanceOf(SkinManagerRuntime)
    expect(readLocale()).toBe(SETTINGS_NS)
    const entries = readRegistrations()

    const section = entries.find(entry => entry.registration.id === 'appearance')!
    expect(section.slotName).toBe('settings.section')
    expect(section.registration.name).toBe('settings.section')
    expect(section.registration.order).toBe(5)

    const row = entries.find(entry => entry.registration.id === 'skin-manager')!
    expect(row.slotName).toBe('settings.appearance.item')
    expect(row.registration.name).toBe('settings.appearance.item')
    expect(row.registration.order).toBe(20)
    expect(row.registration.locale).toBe(SETTINGS_NS)
  })

  it('drives a persisted switch through the injected setSkin face', () => {
    const { ctx, provided, host, readRegistrations } = fakeCtx()
    apply(ctx)

    const runtime = provided.get('skinManager') as SkinManagerRuntime
    const applySkin = vi.fn(() => () => {})
    const skin: SkinDefinition = { id: 'maid-atelier', label: '深海女仆', apply: applySkin }
    runtime.register(skin)

    const syncSpy = vi.fn()
    const row = readRegistrations().find(entry => entry.registration.id === 'skin-manager')!
    const { setSkin } = row.registration.inject({ sync: syncSpy })
    expect(syncSpy).toHaveBeenCalledWith(expect.objectContaining({ activeId: 'classic' }))

    setSkin('maid-atelier')

    expect(applySkin).toHaveBeenCalledTimes(1)
    expect(document.body.dataset.dsSkin).toBe('maid-atelier')
    expect(host.read()).toEqual({ [SKIN_SETTINGS_FIELD]: 'maid-atelier' })
  })
})
