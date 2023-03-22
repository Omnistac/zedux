import { createStore } from '@zedux/core'
import {
  atom,
  createEcosystem,
  injectAtomInstance,
  injectEffect,
  injectStore,
} from '@zedux/react'

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

  test("state set on a `subscribed` store during atom evaluation doesn't trigger a reevaluation", () => {
    // this exact atom1, atom2 setup is needed to prevent a scheduler loop regression
    const atom1 = atom('1', () => {
      const store = injectStore(0)

      store.setState(state => state + 1)

      return store
    })

    const atom2 = atom('2', () => {
      const store = injectStore(0)
      const instance1 = injectAtomInstance(atom1)

      injectEffect(
        () => {
          const subscription = store.subscribe(() => {
            instance1.setState(state => state + 1)
          })

          return () => subscription.unsubscribe()
        },
        [],
        { synchronous: true }
      )

      return store
    })

    const instance2 = ecosystem.getInstance(atom2)
    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.getState()).toBe(1)
    expect(instance2.getState()).toBe(0)

    instance2.setState(1)

    expect(instance1.getState()).toBe(3)
    expect(instance2.getState()).toBe(1)
  })
})
