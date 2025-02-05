import React, { useState } from 'react'
import {
  atom,
  injectStore,
  useAtomInstance,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { act } from '@testing-library/react'
import { ecosystem } from '../utils/ecosystem'

describe('issue #154', () => {
  test('repro', async () => {
    ;(globalThis as any).useReact18UseId()

    const poller = atom(
      'poller',
      () => {
        const store = injectStore(0)

        return store
      },
      { ttl: 0 }
    )

    function Counter({ id }: { id: number }) {
      const count = useAtomValue(poller)
      const instance = useAtomInstance(poller)

      useAtomSelector(({ get }) => get(poller))

      return (
        <div>
          <div>
            count for {id} is {count} ({instance.getState()})
          </div>
        </div>
      )
    }

    function App() {
      const [showCounter, setShowCounter] = useState(true)
      return (
        <div>
          <div className="card">
            <button
              style={{ marginBottom: 10 }}
              onClick={() => {
                setShowCounter(!showCounter)
              }}
            >
              Toggle
            </button>
            {showCounter && (
              <>
                <Counter id={1} />
                <Counter id={2} />
              </>
            )}
          </div>
        </div>
      )
    }

    const { findByText } = renderInEcosystem(<App />, { useStrictMode: true })
    const button = await findByText('Toggle')

    expect(ecosystem._graph.nodes['poller'].dependents.size).toBe(6)

    await act(() => {
      button.click()
    })

    expect(ecosystem._graph.nodes['poller']).toBeUndefined()

    await act(() => {
      button.click()
    })

    expect(ecosystem._graph.nodes['poller'].dependents.size).toBe(6)
  })
})
