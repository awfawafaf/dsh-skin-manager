/**
 * Skin preference row registered into the General section item slot: title +
 * one chip per registered skin. Selection follows the persisted preference
 * (the manager's active id), never a local guess.
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SkinManagerKey } from './locales.ts'
import type { createSkinRowStore } from './settings-store.ts'
import css from './skin-row.module.css'

/** Injected business face: the active-skin write (t rides the standard locale seat). */
export interface SkinRowInjected {
  /** Switch the active skin. */
  setSkin: (id: string) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type SkinRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createSkinRowStore>>
  & PropsLocale<'settings.skin-manager'> & SkinRowInjected

/**
 * Render the skin row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function SkinRow({ t, setSkin, useStore }: SkinRowComponentProps) {
  const activeId = useStore(s => s.activeId)
  const skins = useStore(s => s.skins)
  const ordered = [...skins].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  return (
    <div className={css.group}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.chipRow}>
        {ordered.map(skin => (
          <button
            key={skin.id}
            type="button"
            className={activeId === skin.id ? `${css.chip} ${css.selected}` : css.chip}
            aria-pressed={activeId === skin.id}
            onClick={() => { setSkin(skin.id) }}
          >
            {skin.accent !== undefined && (
              <span className={css.swatch} style={{ backgroundColor: skin.accent }} aria-hidden="true" />
            )}
            {skin.label}
          </button>
        ))}
      </div>
    </div>
  )
}
