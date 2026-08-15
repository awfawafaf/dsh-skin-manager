// @vitest-environment jsdom
/**
 * SkinRow component tests: one chip per registered skin, the active skin
 * marked, and a chip click commits the switch through the injected face.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SkinRow, type SkinRowComponentProps } from '../src/client/skin-row.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

function makeProps(): SkinRowComponentProps {
  const skins = [
    { id: 'classic', label: '经典', order: 0 },
    { id: 'maid-atelier', label: '深海女仆', accent: '#c5a468', order: 5 },
    { id: 'background', label: '自定义背景', accent: '#4a7bd4', order: 6 },
  ]
  return {
    useStore: (selector: (state: { activeId: string; skins: typeof skins; revision: number }) => unknown) =>
      selector({ activeId: 'maid-atelier', skins, revision: 2 }),
    t: (key: keyof typeof zh) => zh[key],
    setSkin: vi.fn(),
  } as unknown as SkinRowComponentProps
}

describe('SkinRow', () => {
  it('renders one chip per skin in order with the active one pressed', () => {
    render(<SkinRow {...makeProps()} />)

    const chips = screen.getAllByRole('button')
    expect(chips.map(chip => chip.textContent)).toEqual(['经典', '深海女仆', '自定义背景'])
    expect(chips[1]!.getAttribute('aria-pressed')).toBe('true')
    expect(chips[0]!.getAttribute('aria-pressed')).toBe('false')
  })

  it('commits the switch when a chip is clicked', () => {
    const props = makeProps()
    render(<SkinRow {...props} />)

    fireEvent.click(screen.getByText('自定义背景'))

    expect(props.setSkin).toHaveBeenCalledWith('background')
  })
})
