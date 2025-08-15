import { createStore } from '@zedux/core'
import { injectAtomInstance, injectEffect } from '@zedux/react'
import { storeAtom, injectStore, storeIon } from '@zedux/stores'
import { ecosystem } from '../utils/ecosystem'

describe('stores in atoms', () => {
  test('state set in a parent store subscriber lets previous dispatches inform subscribers in order', () => {
    const calls: any[] = []

    const atom1 = storeAtom('1', () => {
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
    const atom1 = storeAtom('1', () => {
      const store = injectStore(0)

      store.setState(state => state + 1)

      return store
    })

    const atom2 = storeAtom('2', () => {
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

  test("nested store subscribers don't see state tearing", () => {
    const calls: {
      atomValue: number
      passedStoreValue: number
      storeValue: number
    }[] = []

    // this exact setup - atom1 -> atom2 -> atom3 - reproduces an actual state
    // tearing bug we had.
    const atom1 = storeAtom('1', () => injectStore(1))

    const atom2 = storeIon('2', ({ get }) => get(atom1))

    const atom3 = storeAtom('3', () => {
      const store = injectStore(1)
      const instance2 = injectAtomInstance(atom2)

      injectEffect(
        () => {
          const subscription = instance2.store.subscribe(newState => {
            calls.push({
              // for store atom's, `.get` is an alias for `.getState` which is
              // an alias for `.store.getState`. But `.getOnce` returns
              // `instance.v` directly, so check that for state tearing:
              atomValue: instance2.getOnce(),
              passedStoreValue: newState,
              storeValue: instance2.store.getState(),
            })
          })

          return () => subscription.unsubscribe()
        },
        [],
        { synchronous: true }
      )

      return store
    })

    ecosystem.getInstance(atom3)
    ecosystem.getInstance(atom1).store.setState(2)

    // Verify no state tearing occurred - subscribers should see consistent state
    expect(calls).toEqual([
      { atomValue: 2, passedStoreValue: 2, storeValue: 2 },
    ])
  })

  test("normal store subscribers don't see state tearing", () => {
    let evaluationCount = 0
    const storeValues: number[] = []
    const instanceValues: number[] = []

    const atom1 = storeAtom('reevaluation-tearing-test', () => {
      evaluationCount++
      const initialValue = evaluationCount * 10

      // Return raw value that will be wrapped in a store
      return initialValue
    })

    const instance = ecosystem.getInstance(atom1)

    // Subscribe to both the store and track instance values
    const storeSubscription = instance.store.subscribe(newState => {
      storeValues.push(newState)
      instanceValues.push(instance.get())
    })

    // Initial state
    expect(instance.get()).toBe(10)
    expect(instance.store.getState()).toBe(10)

    // Trigger reevaluation
    instance.invalidate()

    // After reevaluation, both should be consistent
    expect(instance.get()).toBe(20)
    expect(instance.store.getState()).toBe(20)

    // Clean up
    storeSubscription.unsubscribe()

    // Verify no state tearing - instance value should always match store value
    storeValues.forEach((storeValue, index) => {
      expect(instanceValues[index]).toBe(storeValue)
    })
  })
})
