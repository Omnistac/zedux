import {
  api,
  As,
  atom,
  ChangeEvent,
  GraphNode,
  injectSignal,
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

    const [newState, transactions] = instance1.exports.mutateSignal('a', 2)

    expect(newState).toEqual({ a: 2, b: [{ c: 2 }] })
    expect(transactions).toEqual([{ k: 'a', v: 2 }])
  })

  test('deeply mutating a signal generates a transaction with a nested key', () => {
    const instance1 = ecosystem.getNode(atom1)

    const [newState, transactions] = instance1.exports.signal.mutate(state => {
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

  test('mixed mutations and sets all notify subscribers', () => {
    const instance1 = ecosystem.getNode(atom1)
    const calls: any[][] = []

    instance1.exports.signal.on('mutate', (transactions, eventMap) => {
      expectTypeOf(transactions).toEqualTypeOf<Transaction[]>()

      calls.push(['mutate', transactions, eventMap])
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

      calls.push(['change', change, eventMap])
    })

    instance1.exports.signal.mutate(state => {
      state.b[0].c = 3
      state.b = []
    })

    const commonChangeProps = {
      operation: 'on',
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

    expect(calls).toEqual([
      ['mutate', expectedEvents.mutate, expectedEvents],
      ['change', expectedEvents.change, expectedEvents],
    ])
    calls.splice(0, 2)

    instance1.exports.signal.set(state => ({ ...state, a: state.a + 1 }))

    const expectedEvents2 = {
      change: {
        newState: { a: 2, b: [] },
        oldState: { a: 1, b: [] },
        ...commonChangeProps,
      },
    }

    expect(calls).toEqual([['change', expectedEvents2.change, expectedEvents2]])
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
})
