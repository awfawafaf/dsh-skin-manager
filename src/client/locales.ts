/** Skin-manager dictionaries (the skin row + the Appearance section). */

export const zh = {
  title: '皮肤',
  appearanceNav: '外观',
} as const

export const en = {
  title: 'Skin',
  appearanceNav: 'Appearance',
} as const

/** Locale keys for the skin-manager row and the Appearance section. */
export type SkinManagerKey = keyof typeof zh
