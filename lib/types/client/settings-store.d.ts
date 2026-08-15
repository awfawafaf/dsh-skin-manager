/**
 * Skin row slot store: a mirror of the skin-manager snapshot. The plugin's
 * apply-world change listener is the only writer; the row component reads
 * via props.useStore.
 */
import { type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client';
import type { SkinManagerSnapshot, SkinView } from '../skin-contract.ts';
/** Store state mirrored from the skin-manager snapshot. */
export interface SkinRowState {
    /** Active skin id. */
    activeId: string;
    /** Registered skin rows. */
    skins: readonly SkinView[];
    /** Snapshot revision; -1 until the first sync so revision 0 lands as a change. */
    revision: number;
}
/** Declared action shape giving the exported factory a stable return type. */
type SkinRowActions = {
    sync: (draft: SkinRowState, snapshot: SkinManagerSnapshot) => void;
};
/**
 * Declares the skin row state and write surface.
 * @returns the store handle.
 */
export declare function createSkinRowStore(): EngineStoreHandle<SkinRowState, SkinRowActions>;
export {};
