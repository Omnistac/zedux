import { createStore } from '@zedux/core'
import { atom, createEcosystem } from '@zedux/react'

const ecosystem = createEcosystem({ id: 'test' })

afterEach(() => {
  ecosystem.reset()
})

describe('stores in atoms', () => {
  test('state set in a parent store subscriber lets previous dispatches inform subscribers in order', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const child = createStore(null, 'a')
      const parent = createStore({ child })
      const grandparent = createStore({ parent })

      const childSubscriber = child.subscribe(newState =>
        calls.push({ child: newState })
      )
      const parentSubscriber = parent.subscribe(newState => {
        calls.push({ parent: newState })

        if (newState.child === 'b') {
          parent.setState({ child: 'c' })
        }
      })
      const grandparentSubscriber = grandparent.subscribe(newState =>
        calls.push({ grandparent: newState })
      )

      child.setState('b')

      childSubscriber.unsubscribe()
      parentSubscriber.unsubscribe()
      grandparentSubscriber.unsubscribe()
    })

    ecosystem.getInstance(atom1)

    expect(calls).toEqual([
      { child: 'b' },
      { parent: { child: 'b' } },
      { grandparent: { parent: { child: 'b' } } },
      { child: 'c' },
      { parent: { child: 'c' } },
      { grandparent: { parent: { child: 'c' } } },
    ])
  })
})
