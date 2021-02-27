import '@testing-library/jest-dom/extend-expect'
import { atom, createStore, injectMemo, injectStore } from '@zedux/react'
import React from 'react'

const parentAtom = atom('parent', () => {
  const store = injectMemo(() => createStore(null, 0), [])

  return store
})

const Child = () => {}

describe('DI: atom -> component', () => {
  describe('atom.useValue()', () => {
    test('returns current state of the atom', () => {
      const Test = () => {
        const val = parentAtom.useValue()

        return <div>{val}</div>
      }

      expect(2).toBe(2)
    })
  })
})
