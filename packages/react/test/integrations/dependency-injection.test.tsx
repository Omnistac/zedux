import '@testing-library/jest-dom/extend-expect'
import {
  api,
  atom,
  createStore,
  injectEffect,
  injectStore,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { FC } from 'react'
import { renderInEcosystem } from '@zedux/react-test/utils/renderInEcosystem'
import { fireEvent } from '@testing-library/dom'
import { act } from '@testing-library/react'

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
    test('returns current state of the atom', () => {
      const Test: FC = () => {
        const val = useAtomValue(normalAtom)

        expect(val).toBe(0)

        return null
      }

      renderInEcosystem(<Test />)
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
})
