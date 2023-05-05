import { act } from '@testing-library/react'
import { atom, useAtomInstance } from '@zedux/react'
import React from 'react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('useAtomInstance', () => {
  test('passing { subscribe: true } subscribes', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')

    function Test() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.getState()}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(atom1).setState('b')
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('b')
  })

  test('recreates the atom instance on force destruction', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')

    function Test() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.getState()}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(atom1).setState('b')
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('b')

    act(() => {
      ecosystem.getInstance(atom1).destroy(true)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('a')
  })
})
