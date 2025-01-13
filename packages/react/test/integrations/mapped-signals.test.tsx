import {
  api,
  atom,
  injectMappedSignal,
  injectSignal,
  StateOf,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

describe('mapped signals', () => {
  test('forward state updates to inner signals', () => {
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

  test('forward state updates from inner signals to observers', () => {
    const atom1 = atom('1', () => {
      const a = injectSignal('a')
      const b = injectSignal({ nested: 'b' })

      const mappedSignal = injectMappedSignal({ a, b })

      return api(mappedSignal).setExports({ a, b })
    })

    const instance1 = ecosystem.getNode(atom1)
    const calls: any[] = []

    instance1.on('change', ({ newState, oldState, type }) => {
      calls.push({ newState, oldState, type })
    })

    const expectedState1 = { a: 'a', b: { nested: 'b' } }

    expect(instance1.getOnce()).toEqual(expectedState1)

    instance1.exports.a.set('aa')

    const expectedState2 = { a: 'aa', b: { nested: 'b' } }

    expect(instance1.get()).toEqual(expectedState2)
    expect(calls).toEqual([
      {
        newState: expectedState2,
        oldState: expectedState1,
        type: 'change',
      },
    ])
    calls.splice(0, 1)

    instance1.exports.b.mutate(state => {
      state.nested = 'bb'
    })

    const expectedState3 = { a: 'aa', b: { nested: 'bb' } }

    expect(instance1.getOnce()).toEqual(expectedState3)
    expect(calls).toEqual([
      {
        newState: expectedState3,
        oldState: expectedState2,
        type: 'change',
      },
    ])
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
