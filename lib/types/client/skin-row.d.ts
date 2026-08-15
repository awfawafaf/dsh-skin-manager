/**
 * Skin preference row registered into the General section item slot: title +
 * one chip per registered skin. Selection follows the persisted preference
 * (the manager's active id), never a local guess.
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createSkinRowStore } from './settings-store.ts';
/** Injected business face: the active-skin write (t rides the standard locale seat). */
export interface SkinRowInjected {
    /** Switch the active skin. */
    setSkin: (id: string) => void;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type SkinRowComponentProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createSkinRowStore>> & PropsLocale<'settings.skin-manager'> & SkinRowInjected;
/**
 * Render the skin row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export declare function SkinRow({ t, setSkin, useStore }: SkinRowComponentProps): import("react").JSX.Element;
