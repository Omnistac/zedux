import {
  api,
  As,
  atom,
  ChangeEvent,
  GraphNode,
  injectEcosystem,
  injectSignal,
  ion,
  Signal,
  StateOf,
  Transaction,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

const atom1 = atom('1', () => {
  const signal = injectSignal(
    { a: 1, b: [{ c: 2 }] },
    {
      events: {
        eventA: As<{ test: boolean }>,
      },
    }
  )

  return api(signal).setExports({
    mutateSignal: <K extends keyof StateOf<typeof signal>>(
      key: K,
      value: StateOf<typeof signal>[K]
    ) =>
      signal.mutate(state => {
        state[key] = value
      }),
    setSignal: (state: StateOf<typeof signal>) => signal.set(state),
    signal,
  })
})

describe('signals', () => {
  test('setting a signal triggers state changes in the injecting atom', () => {
    const instance1 = ecosystem.getNode(atom1)

    expect(instance1.get()).toEqual({ a: 1, b: [{ c: 2 }] })

    instance1.exports.setSignal({ a: 2, b: [{ c: 3 }] })

    expect(instance1.get()).toEqual({ a: 2, b: [{ c: 3 }] })
  })

  test('mutating a signal triggers state changes in the injecting atom', () => {
    const instance1 = ecosystem.getNode(atom1)

    instance1.exports.mutateSignal('a', 2)

    expect(instance1.get()).toEqual({ a: 2, b: [{ c: 2 }] })
  })

  test('mutating a signal generates a transaction', () => {
    const instance1 = ecosystem.getNode(atom1)
    let transactions
    let newState

    instance1.exports.signal.on(
      'mutate',
      (receivedTransactions, { change }) => {
        transactions = receivedTransactions
        newState = change?.newState
      }
    )

    instance1.exports.mutateSignal('a', 2)

    expect(newState).toEqual({ a: 2, b: [{ c: 2 }] })
    expect(transactions).toEqual([{ k: 'a', v: 2 }])
  })

  test('deeply mutating a signal generates a transaction with a nested key', () => {
    const instance1 = ecosystem.getNode(atom1)
    let transactions
    let newState

    instance1.exports.signal.on(
      'mutate',
      (receivedTransactions, { change }) => {
        transactions = receivedTransactions
        newState = change?.newState
      }
    )

    instance1.exports.signal.mutate(state => {
      state.b[0].c = 3
    })

    expect(newState).toEqual({ a: 1, b: [{ c: 3 }] })
    expect(transactions).toEqual([{ k: ['b', '0', 'c'], v: 3 }])
  })

  test('mutate listeners are notified of a transaction', () => {
    const instance1 = ecosystem.getNode(atom1)
    const transactionsList: Transaction[][] = []

    instance1.exports.signal.on('mutate', transactions => {
      expectTypeOf(transactions).toEqualTypeOf<Transaction[]>()
      transactionsList.push(transactions)
    })

    instance1.exports.signal.mutate(state => {
      state.b[0].c = 3
    })

    expect(transactionsList).toEqual([[{ k: ['b', '0', 'c'], v: 3 }]])
  })

  test('mutations and sets on an injected signal notify direct and transitive observers', () => {
    const instance1 = ecosystem.getNode(atom1)
    const calls: any[][] = []

    instance1.exports.signal.on('mutate', (transactions, eventMap) => {
      expectTypeOf(transactions).toEqualTypeOf<Transaction[]>()

      calls.push(['direct mutate', transactions, eventMap])
    })

    type GenericsOf<T extends GraphNode> = T extends Signal<infer G> ? G : never

    type ExpectedChangeEvent = ChangeEvent<
      GenericsOf<typeof instance1.exports.signal> & {
        Params: undefined
        Template: undefined
      }
    >

    instance1.exports.signal.on('change', (change, eventMap) => {
      expectTypeOf(change).toEqualTypeOf<ExpectedChangeEvent>()

      calls.push(['direct change', change, eventMap])
    })

    instance1.on('change', (change, eventMap) => {
      calls.push(['transitive change', change, eventMap])
    })

    instance1.exports.signal.mutate(state => {
      state.b[0].c = 3
      state.b = []
    })

    const commonChangeProps = {
      operation: undefined,
      reasons: [],
      source: instance1.exports.signal,
      type: 'change',
    }

    const expectedEvents = {
      change: {
        newState: { a: 1, b: [] },
        oldState: { a: 1, b: [{ c: 2 }] },
        ...commonChangeProps,
      },
      mutate: [
        { k: ['b', '0', 'c'], v: 3 },
        { k: 'b', v: [] },
      ],
    }

    const expectedTransitiveEvents = {
      ...expectedEvents,
      change: {
        ...expectedEvents.change,
        reasons: [expectedEvents.change],
        source: instance1,
      },
    }

    expect(calls).toEqual([
      ['direct mutate', expectedEvents.mutate, expectedEvents],
      ['direct change', expectedEvents.change, expectedEvents],
      [
        'transitive change',
        expectedTransitiveEvents.change,
        expectedTransitiveEvents,
      ],
    ])
    calls.splice(0, 3)

    instance1.exports.signal.set(state => ({ ...state, a: state.a + 1 }))

    const expectedEvents2 = {
      change: {
        newState: { a: 2, b: [] },
        oldState: { a: 1, b: [] },
        ...commonChangeProps,
      },
    }

    const expectedTransitiveEvents2 = {
      change: {
        ...expectedEvents2.change,
        reasons: [expectedEvents2.change],
        source: instance1,
      },
    }

    expect(calls).toEqual([
      ['direct change', expectedEvents2.change, expectedEvents2],
      [
        'transitive change',
        expectedTransitiveEvents2.change,
        expectedTransitiveEvents2,
      ],
    ])
  })

  test("a non-reactively-injected signal still updates the atom's value", () => {
    const testAtom = atom('test', () => {
      const signal = injectSignal(1, { reactive: false })

      return api(signal).setExports({
        increment: () => signal.set(state => state + 1),
      })
    })

    const testInstance = ecosystem.getNode(testAtom)

    expect(testInstance.v).toBe(1)
    expect(testInstance.get()).toBe(1)
    expect(testInstance.getOnce()).toBe(1)

    testInstance.exports.increment()

    expect(testInstance.v).toBe(2)
    expect(testInstance.get()).toBe(2)
    expect(testInstance.getOnce()).toBe(2)
  })

  test('calling `.get()` in a reactive context registers graph edges', () => {
    const calls: any[] = []
    const atom1 = atom('1', 'a')

    const atom2 = ion('2', ({ getNode }) => {
      const node1 = getNode(atom1)

      const signal = injectSignal('')
      signal.set(node1.get() + 'b')

      calls.push(signal.get())

      return signal
    })

    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)

    expect(node2.get()).toBe('ab')
    expect(calls).toEqual(['', 'ab'])

    node1.set('aa')

    expect(node2.get()).toBe('aab')
    expect(calls).toEqual(['', 'ab', 'ab', 'aab'])

    node2.set('c') // will flip then flip back; node2's state is always derived

    expect(node2.get()).toBe('aab')
    expect(calls).toEqual(['', 'ab', 'ab', 'aab', 'c', 'aab'])

    node1.set('aaa')

    expect(node2.get()).toBe('aaab')
    expect(calls).toEqual(['', 'ab', 'ab', 'aab', 'c', 'aab', 'aab', 'aaab'])
  })

  test('calling `.getOnce()` in a reactive context does not register graph edges', () => {
    const atom1 = atom('1', 'a')

    const atom2 = ion('2', ({ getNode }) => {
      const node1 = getNode(atom1)

      const signal = injectSignal('')
      signal.set(node1.getOnce() + 'b')

      return signal
    })

    const node2 = ecosystem.getNode(atom2)

    expect(node2.get()).toBe('ab')

    ecosystem.getNode(atom1).set('aa')

    expect(node2.get()).toBe('ab')
  })

  test('setting a signal during atom evaluation eventually resolves', () => {
    const calls: any[] = []
    const atom1 = atom('1', 1)

    const atom2 = atom('2', () => {
      const { get } = injectEcosystem()
      const val1 = get(atom1)
      const signal = injectSignal(2)

      if (signal.get() !== val1) signal.set(val1)

      calls.push([val1, signal.get()])

      return signal
    })

    const node2 = ecosystem.getNode(atom2)

    expect(node2.get()).toBe(1)
    expect(calls).toEqual([
      [1, 2],
      [1, 1],
    ])
  })

  test('multiple deferred state updates run in order', () => {
    const calls: any[] = []
    const atom1 = atom('1', 'a')

    const atom2 = atom('2', () => {
      const { getNode } = injectEcosystem()
      const node1 = getNode(atom1)
      const val1 = node1.get()
      const signal = injectSignal({ str: val1 })

      if (!calls.length) {
        signal.set({ str: 'a' })
        signal.set(state => ({ str: state.str + 'b' }))
        node1.set(signal.get().str) // noop
        signal.mutate(state => {
          state.str += 'c'
        })
        signal.mutate(state => ({ str: state.str + 'd' }))
      }

      if (signal.get().str === 'abcd') {
        node1.set(signal.get().str)
      }

      calls.push([val1, signal.get()])

      return signal
    })

    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)

    expect(node1.get()).toBe('abcd')
    expect(node2.get()).toEqual({ str: 'abcd' })
    expect(calls).toEqual([
      ['a', { str: 'a' }],
      ['a', { str: 'abcd' }],
      ['abcd', { str: 'abcd' }],
    ])
  })
})
