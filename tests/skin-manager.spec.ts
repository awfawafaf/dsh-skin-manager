// @vitest-environment jsdom
/**
 * SkinManagerRuntime unit tests: registry semantics, active-skin lifecycle,
 * preference adoption/persistence, and the classic fallback. The host is a
 * fake settings scope; the DOM is jsdom.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinDefinition } from '../src/skin-contract.ts'
import { SkinManagerRuntime } from '../src/client/skin-manager.ts'
import { SKIN_SETTINGS_FIELD, type SkinSettings } from '../src/skin-settings.ts'

function fakeHost(initial?: SkinSettings) {
  let value = initial
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
    } as unknown as SettingsScope<SkinSettings>,
    setValue(next: SkinSettings): void {
      value = next
      for (const listener of listeners) listener()
    },
  }
}

function makeSkin(overrides: Partial<SkinDefinition> = {}): SkinDefinition {
  return {
    id: 'sepia',
    label: 'Sepia',
    apply: () => () => {},
    ...overrides,
  }
}

const contexts: Context[] = []

function makeRuntime(host = fakeHost()): { runtime: SkinManagerRuntime; host: ReturnType<typeof fakeHost> } {
  const ctx = new Context()
  contexts.push(ctx)
  return { runtime: new SkinManagerRuntime(ctx, host.scope), host }
}

afterEach(() => {
  // cordis 4 exposes dispose on fibers, not the bare root context; the
  // contexts are kept only so the event bus stays alive for the test.
  contexts.length = 0
  delete document.body.dataset.dsSkin
  vi.restoreAllMocks()
})

describe('SkinManagerRuntime', () => {
  it('boots with the classic skin active and the stock look untouched', () => {
    const { runtime } = makeRuntime()
    const snapshot = runtime.getSnapshot()
    expect(snapshot.activeId).toBe('classic')
    expect(snapshot.skins.map(skin => skin.id)).toEqual(['classic'])
    expect(document.body.dataset.dsSkin).toBe('classic')
  })

  it('registers skins and publishes snapshots in registration order', () => {
    const { runtime } = makeRuntime()
    const events: unknown[] = []
    const ctx = contexts.at(-1)!
    ctx.on('skinManager/change', (snapshot) => { events.push(snapshot) })

    runtime.register(makeSkin())
    runtime.register(makeSkin({ id: 'ocean', label: 'Ocean' }))

    const snapshot = runtime.getSnapshot()
    expect(snapshot.skins.map(skin => skin.id)).toEqual(['classic', 'sepia', 'ocean'])
    expect(snapshot.revision).toBe(2)
    expect(events).toHaveLength(2)
  })

  it('rejects duplicate ids and the reserved default id', () => {
    const { runtime } = makeRuntime()
    runtime.register(makeSkin())
    expect(() => runtime.register(makeSkin())).toThrow('already registered')
    expect(() => runtime.register(makeSkin({ id: 'classic' }))).toThrow('built-in default skin id')
  })

  it('applies a skin the persisted preference names once it registers', () => {
    const host = fakeHost({ skin: 'maid-atelier' })
    const { runtime } = makeRuntime(host)
    expect(runtime.getSnapshot().activeId).toBe('classic')

    const apply = vi.fn(() => () => {})
    runtime.register(makeSkin({ id: 'maid-atelier', label: '深海女仆', apply }))

    expect(apply).toHaveBeenCalledTimes(1)
    expect(runtime.getSnapshot().activeId).toBe('maid-atelier')
    expect(document.body.dataset.dsSkin).toBe('maid-atelier')
  })

  it('setSkin switches, persists, and disposes the previous skin', () => {
    const { runtime, host } = makeRuntime()
    const dispose = vi.fn(() => {})
    runtime.register(makeSkin({ apply: () => dispose }))

    runtime.setSkin('sepia')
    expect(document.body.dataset.dsSkin).toBe('sepia')
    expect(runtime.getSnapshot().activeId).toBe('sepia')
    expect(host.scope.getSnapshot().value?.skin).toBe('sepia')
    expect(dispose).not.toHaveBeenCalled()

    runtime.setSkin('classic')
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(document.body.dataset.dsSkin).toBe('classic')
    expect(runtime.getSnapshot().activeId).toBe('classic')
  })

  it('setSkin rejects unknown ids', () => {
    const { runtime } = makeRuntime()
    expect(() => runtime.setSkin('nope')).toThrow('not registered')
  })

  it('unregistering the active skin falls back to the classic skin', () => {
    const { runtime } = makeRuntime()
    const dispose = vi.fn(() => {})
    const remove = runtime.register(makeSkin({ apply: () => dispose }))
    runtime.setSkin('sepia')

    remove()

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(runtime.getSnapshot().activeId).toBe('classic')
    expect(runtime.getSnapshot().skins.map(skin => skin.id)).toEqual(['classic'])
  })

  it('adopts an external scope change and applies the new preference', () => {
    const { runtime, host } = makeRuntime()
    runtime.register(makeSkin({ id: 'ocean', label: 'Ocean' }))
    host.setValue({ skin: 'ocean' })
    expect(runtime.getSnapshot().activeId).toBe('ocean')
    expect(document.body.dataset.dsSkin).toBe('ocean')
  })

  it('dispose releases the active skin and clears the body attribute', () => {
    const { runtime } = makeRuntime()
    const dispose = vi.fn(() => {})
    runtime.register(makeSkin({ apply: () => dispose }))
    runtime.setSkin('sepia')

    runtime.dispose()

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(document.body.hasAttribute('data-ds-skin')).toBe(false)
  })

  it('keeps the persisted id when the pending skin never registers', () => {
    const host = fakeHost({ skin: 'missing' })
    const { runtime } = makeRuntime(host)
    expect(runtime.getSnapshot().activeId).toBe('classic')
    expect(host.scope.getSnapshot().value?.skin).toBe('missing')
  })
})
