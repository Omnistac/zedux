import React, { useState } from 'react'
import {
  atom,
  injectSignal,
  useAtomInstance,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { act } from '@testing-library/react'
import { ecosystem } from '../utils/ecosystem'

describe('issue #154', () => {
  test('repro', async () => {
    // this issue is only in React 18. Zedux v2+ drops support for React 18.
    // ;(globalThis as any).useReact18UseId()

    const poller = atom(
      'poller',
      () => {
        const signal = injectSignal(0)

        return signal
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
            count for {id} is {count} ({instance.get()})
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

    expect(ecosystem.n.get('poller')?.o.size).toBe(6)

    await act(() => {
      button.click()
    })

    expect(ecosystem.n.get('poller')).toBeUndefined()

    await act(() => {
      button.click()
    })

    expect(ecosystem.n.get('poller')?.o.size).toBe(6)
  })
})
