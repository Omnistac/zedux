import '@testing-library/jest-dom/extend-expect'
import {
  atom,
  createStore,
  injectEffect,
  injectMemo,
  injectStore,
} from '@zedux/react'
import React, { FC } from 'react'
import { renderInApp } from '@zedux/react-test/utils/renderInApp'

const normalAtom = atom('normal', () => {
  const store = injectMemo(() => createStore(null, 0), [])

  return store
})

const updatingAtom = atom('updating', () => {
  const store = injectMemo(() => createStore(null, 0), [])

  injectEffect(() => {
    const timeoutId = setTimeout(() => {
      store.setState(1)
    })

    return () => clearTimeout(timeoutId)
  }, [])

  return store
})

describe('DI: atom -> component', () => {
  describe('atom.useValue()', () => {
    test('returns current state of the atom', () => {
      const Test: FC = () => {
        const val = normalAtom.useValue()

        expect(val).toBe(0)

        return null
      }

      renderInApp(<Test />)
    })

    test("subscribes to the atom instance's store", async () => {
      const Test: FC = () => {
        const val = updatingAtom.useValue()

        if (!val) return null

        return <div data-testid="a">{val}</div>
      }

      const { findByTestId } = renderInApp(<Test />)

      const div = await findByTestId('a')

      expect(div).toHaveTextContent('1')
    })
  })
})
