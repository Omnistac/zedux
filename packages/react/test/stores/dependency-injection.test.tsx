import { fireEvent } from '@testing-library/dom'
import '@testing-library/jest-dom/extend-expect'
import { act } from '@testing-library/react'
import {
  injectEcosystem,
  injectEffect,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import { api, atom, createStore, injectStore, ion } from '@zedux/stores'
import React, { FC } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { ecosystem } from '../utils/ecosystem'

const normalAtom = atom('normal', () => {
  const store = injectStore(0)

  return store
})

const updatingAtom = atom('updating', () => {
  const store = injectStore(0)

  injectEffect(() => {
    const timeoutId = setTimeout(() => {
      store.setState(1)
    })

    return () => clearTimeout(timeoutId)
  }, [])

  return store
})

const composedStoresAtom = atom('composedStores', () => {
  const a = injectStore(1)
  const b = injectStore(2)
  const store = injectStore(() => createStore({ a, b }))

  return api(store).setExports({
    update: () => {
      a.setState(11)
      b.setState(22)
    },
  })
})

describe('using atoms in components', () => {
  describe('useAtomValue()', () => {
    test('returns current state of the atom', async () => {
      let val: number | undefined

      const Test: FC = () => {
        val = useAtomValue(normalAtom)

        return <div data-testid="a">{val}</div>
      }

      const { findByTestId } = renderInEcosystem(<Test />)

      expect(await findByTestId('a')).toHaveTextContent('0')

      expect(val).toBe(0)
    })

    test('creates a dynamic graph dependency that renders component when atom state changes', async () => {
      const Test: FC = () => {
        const val = useAtomValue(updatingAtom)

        if (!val) return null

        return <div data-testid="a">{val}</div>
      }

      const { findByTestId } = renderInEcosystem(<Test />)

      const div = await findByTestId('a')

      expect(div).toHaveTextContent('1')
    })
  })

  test('multiple synchronous state changes will result in one component rerender', async () => {
    jest.useFakeTimers()
    const renders: { a: number; b: number }[] = []

    const Test: FC = () => {
      const val = useAtomValue(composedStoresAtom)
      const { update } = useAtomInstance(composedStoresAtom).exports

      renders.push(val)

      return (
        <>
          <div data-testid="a">{val.a}</div>
          <div data-testid="b">{val.b}</div>
          <button onClick={update}>update</button>
        </>
      )
    }

    const { findByTestId, findByText } = renderInEcosystem(<Test />)

    const divA = await findByTestId('a')
    const divB = await findByTestId('b')
    const button = await findByText('update')

    expect(divA).toHaveTextContent('1')
    expect(divB).toHaveTextContent('2')
    expect(renders).toEqual([{ a: 1, b: 2 }])

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(divA).toHaveTextContent('11')
    expect(divB).toHaveTextContent('22')
    expect(renders).toEqual([
      { a: 1, b: 2 },
      { a: 11, b: 22 },
    ])
  })

  test('overrides can be dynamically swapped in and out', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')
    const atom1Override = atom1.override('aa')
    const atom2Override = atom2.override(
      () => injectEcosystem().get(atom1) + 'bb'
    )

    function Test() {
      const two = useAtomValue(atom2)

      return <div data-testid="text">{two}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('ab')

    act(() => {
      ecosystem.addOverrides([atom2Override])
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('abb')

    act(() => {
      ecosystem.addOverrides([atom1Override])
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('aabb')

    act(() => {
      ecosystem.removeOverrides([atom2Override])
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('aab')
  })
})
