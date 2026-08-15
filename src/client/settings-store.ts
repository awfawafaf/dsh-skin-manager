/**
 * Skin row slot store: a mirror of the skin-manager snapshot. The plugin's
 * apply-world change listener is the only writer; the row component reads
 * via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinManagerSnapshot, SkinView } from '../skin-contract.ts'

/** Store state mirrored from the skin-manager snapshot. */
export interface SkinRowState {
  /** Active skin id. */
  activeId: string
  /** Registered skin rows. */
  skins: readonly SkinView[]
  /** Snapshot revision; -1 until the first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type SkinRowActions = {
  sync: (draft: SkinRowState, snapshot: SkinManagerSnapshot) => void
}

/**
 * Declares the skin row state and write surface.
 * @returns the store handle.
 */
export function createSkinRowStore(): EngineStoreHandle<SkinRowState, SkinRowActions> {
  return defineStore({
    init: (): SkinRowState => ({ activeId: 'classic', skins: [], revision: -1 }),
    actions: {
      sync: (d, snapshot: SkinManagerSnapshot) => {
        if (snapshot.revision <= d.revision) return
        d.activeId = snapshot.activeId
        d.skins = snapshot.skins
        d.revision = snapshot.revision
      },
    },
  })
}
