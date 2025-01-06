import {
  api,
  As,
  atom,
  injectMappedSignal,
  injectSignal,
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

    instance1.exports.signal.on('change', (change, eventMap) => {
      expectTypeOf(change).toEqualTypeOf<{
        newState: StateOf<typeof instance1>
        oldState: StateOf<typeof atom1>
      }>()

      calls.push(['change', change, eventMap])
    })

    instance1.exports.signal.mutate(state => {
      state.b[0].c = 3
      state.b = []
    })

    const expectedEvents = {
      change: { newState: { a: 1, b: [] }, oldState: { a: 1, b: [{ c: 2 }] } },
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
      change: { newState: { a: 2, b: [] }, oldState: { a: 1, b: [] } },
    }

    expect(calls).toEqual([['change', expectedEvents2.change, expectedEvents2]])
  })
})

describe('mapped signals', () => {
  test('mapped signals forward state updates to inner signals', () => {
    const values: string[] = []

    const atom1 = atom('1', () => {
      const a = injectSignal('a')
      const b = injectSignal('b')

      values.push(a.get(), b.get())

      const mappedSignal = injectMappedSignal({ a, b })

      return mappedSignal
    })

    expectTypeOf<StateOf<typeof atom1>>().toEqualTypeOf<{
      a: string
      b: string
    }>()

    const instance1 = ecosystem.getNode(atom1)

    expect(instance1.get()).toEqual({ a: 'a', b: 'b' })
    expect(values).toEqual(['a', 'b'])

    instance1.set(state => ({ ...state, a: 'aa' }))

    expect(instance1.get()).toEqual({ a: 'aa', b: 'b' })
    expect(values).toEqual(['a', 'b', 'aa', 'b'])

    instance1.mutate(state => {
      state.b = 'bb'
    })

    expect(instance1.get()).toEqual({ a: 'aa', b: 'bb' })
    expect(values).toEqual(['a', 'b', 'aa', 'b', 'aa', 'bb'])
  })
})

// const signalA = injectSignal('a', {
//   events: { eventA: As<string>, eventC: As<boolean> },
// })
// const signalB = injectSignal('b', {
//   events: { eventA: As<number>, eventB: As<1 | 2> },
// })

// const result = injectMappedSignal({
//   a: signalA,
//   b: signalB,
// })

// type TEvents = EventsOf<typeof result>
// type Tuple = UnionToTuple<keyof EventsOf<typeof result>>
// type TEvents4 = TupleToEvents<TEvents, Tuple>

// result.on('eventB', (test, map) => 2)
