import { atom, injectStore, api } from '@zedux/atoms'
import { useAtomValue, useAtomInstance } from '@zedux/react'
import React, { act, useEffect } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('issue #182', () => {
  test('repro', async () => {
    const someAtom = atom('some', () => {
      const store = injectStore<{ items: number[] }>({
        items: [],
      })

      function fillItems() {
        store.setState({
          items: [1, 2, 3],
        })
      }

      return api(store).setExports({
        fillItems,
      })
    })

    function ItemList() {
      const { items } = useAtomValue(someAtom)
      return (
        <>
          {items.map(item => (
            <div key={item}>{item}</div>
          ))}
        </>
      )
    }

    let counter = 0

    function App() {
      const { fillItems } = useAtomInstance(someAtom).exports
      counter++

      // Calling api function inside use effect triggers re-render
      // count should be 2 (from strict mode double-render), not 4
      useEffect(() => {
        fillItems()
      }, [])

      return (
        <div className="App">
          <button
            data-testid="button"
            onClick={() => {
              // Calling api function inside button click works as expected,
              // it won't render the app
              fillItems()
            }}
          >
            Fill
          </button>
          <ItemList />
        </div>
      )
    }

    const { findByTestId } = renderInEcosystem(<App />, { useStrictMode: true })
    const button = await findByTestId('button')

    expect(counter).toBe(2)

    act(() => {
      button.click()
    })

    expect(counter).toBe(2)
  })
})
