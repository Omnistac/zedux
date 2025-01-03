import { act } from '@testing-library/react'
import { atom, useAtomInstance, useAtomValue } from '@zedux/react'
import React from 'react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('useAtomInstance', () => {
  test('passing `subscribe: true` subscribes', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')

    function Test() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.get()}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(atom1).set('b')
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('b')
  })

  test('recreates the atom instance on force destruction', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')

    function Test() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.get()}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(atom1).set('b')
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('b')

    act(() => {
      ecosystem.getInstance(atom1).destroy(true)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('a')
  })

  test('recovers from React replacing a component tree, making refCount go from 1 to 0 to 1, when the atom has `ttl: 0`', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a', { ttl: 0 })
    const toggleAtom = atom('toggle', true)

    function TestA() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.get()}</div>
    }

    function TestB() {
      const instance = useAtomInstance(atom1, [], { subscribe: true })

      return <div data-testid="text">{instance.get()}</div>
    }

    function Parent() {
      const showA = useAtomValue(toggleAtom)

      return showA ? <TestA /> : <TestB />
    }

    const { findByTestId } = renderInEcosystem(<Parent />)

    expect((await findByTestId('text')).innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(toggleAtom).set(false)
      jest.runAllTimers()
    })

    expect((await findByTestId('text')).innerHTML).toBe('a')

    act(() => {
      ecosystem.getInstance(atom1).set('b')
      jest.runAllTimers()
    })

    expect((await findByTestId('text')).innerHTML).toBe('b')
  })
})
