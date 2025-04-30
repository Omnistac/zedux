import {
  api,
  As,
  atom,
  EventsOf,
  injectEcosystem,
  injectMappedSignal,
  injectSignal,
  ion,
  StateOf,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

const setupNestedSignals = () => {
  const atom1 = atom('1', () => {
    const signalA = injectSignal({ aa: 1 })
    const signalB = injectSignal(2)
    const signal = injectMappedSignal({ a: signalA, b: signalB })

    return api(signal).setExports({ signal, signalA, signalB })
  })

  const node1 = ecosystem.getNode(atom1)

  expect(node1.get()).toEqual({ a: { aa: 1 }, b: 2 })

  const calls: any[] = []

  node1.on('mutate', transactions => {
    calls.push(['atom mutate', transactions])
  })

  node1.on('change', event => {
    calls.push(['atom change', event.newState])
  })

  node1.exports.signal.on('mutate', transactions => {
    calls.push(['mapped signal mutate', transactions])
  })

  node1.exports.signal.on('change', event => {
    calls.push(['mapped signal change', event.newState])
  })

  node1.exports.signalA.on('mutate', transactions => {
    calls.push(['inner signal a mutate', transactions])
  })

  node1.exports.signalA.on('change', event => {
    calls.push(['inner signal a change', event.newState])
  })

  node1.exports.signalB.on('mutate', transactions => {
    calls.push(['inner signal b mutate', transactions])
  })

  node1.exports.signalB.on('change', event => {
    calls.push(['inner signal b change', event.newState])
  })

  return { calls, node1 }
}

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

  test('atoms can be used as inner signals', () => {
    const atom1 = atom('1', 'a')

    const atom2 = ion('2', ({ getNode }) => {
      const node1 = getNode(atom1)
      const signalB = injectSignal('b')

      const signal = injectMappedSignal({
        a: node1,
        b: signalB,
      })

      expectTypeOf<StateOf<typeof signal>>().toEqualTypeOf<{
        a: string
        b: string
      }>()

      return signal
    })

    const node1 = ecosystem.getNode(atom2)

    expect(node1.get()).toEqual({ a: 'a', b: 'b' })

    ecosystem.getNode(atom1).set('aa')

    expect(node1.get()).toEqual({ a: 'aa', b: 'b' })
  })

  test('forward events from/to inner signals', () => {
    const atom1 = atom('1', () => {
      const signalA = injectSignal('a', {
        events: {
          a1: As<string>,
          a2: As<boolean>,
        },
      })

      const signalB = injectSignal('b', {
        events: {
          b1: As<number>,
        },
      })

      const signal = injectMappedSignal(
        { a: signalA, b: signalB },
        {
          events: {
            c1: As<string[]>,
          },
        }
      )

      return api(signal).setExports({ signal, signalA, signalB })
    })

    const node1 = ecosystem.getNode(atom1)
    const calls: any[] = []

    node1.exports.signalA.on(eventMap => {
      calls.push(['a', eventMap])
    })

    node1.exports.signalB.on(eventMap => {
      calls.push(['b', eventMap])
    })

    node1.exports.signal.on('a1', (_, eventMap) => {
      calls.push(['signal a1', eventMap])
    })

    node1.exports.signal.on('b1', (_, eventMap) => {
      calls.push(['signal b1', eventMap])
    })

    node1.on(eventMap => {
      calls.push(['node *', eventMap])
    })

    // sending to the node will propagate up to all sources then back
    node1.send('a1', 'a')

    const expectedA1Event = { a1: 'a' }

    expect(calls).toEqual([
      // TODO: The order of a and b here is non-deterministic. Maybe address
      // this
      ['b', expectedA1Event],
      ['a', expectedA1Event],
      ['signal a1', expectedA1Event],
      ['node *', expectedA1Event],
    ])
    calls.splice(0, 4)

    // sending to this source will only propagate downward (not back up to
    // signalA)
    node1.exports.signalB.send('b1', 2)

    const expectedB1Event = { b1: 2 }

    expect(calls).toEqual([
      ['b', expectedB1Event],
      ['signal b1', expectedB1Event],
      ['node *', expectedB1Event],
    ])

    expectTypeOf<EventsOf<typeof node1>>().toEqualTypeOf<{
      a1: string
      a2: boolean
      b1: number
      c1: string[]
    }>()
  })

  test('updates inner signal references when they change on subsequent reevaluations', () => {
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ getNode }) => {
      const node1 = getNode(atom1)
      const signal = injectMappedSignal({ a: node1 })

      return api(signal).setExports({ signal })
    })

    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)

    expect(node2.exports.signal.M.a).toBe(node1)

    node1.destroy(true)

    expect(node2.exports.signal.M.a).not.toBe(node1)
    expect(node2.exports.signal.M.a).toBe(ecosystem.getNode(atom1))
  })

  test('mutating outer signal does not send mutate events to inner signals', () => {
    const { calls, node1 } = setupNestedSignals()

    node1.exports.signal.mutate(state => {
      state.a.aa = 11
    })

    expect(node1.get()).toEqual({ a: { aa: 11 }, b: 2 })

    node1.exports.signal.mutate(state => {
      state.a.aa = 1
    })

    const expectedTransactions1 = [{ k: ['a', 'aa'], v: 11 }]
    const expectedTransactions2 = [{ k: ['a', 'aa'], v: 1 }]
    const expectedSequence = [
      ['inner signal a change', { aa: 11 }],
      ['mapped signal mutate', expectedTransactions1],
      ['mapped signal change', { a: { aa: 11 }, b: 2 }],
      ['atom mutate', expectedTransactions1],
      ['atom change', { a: { aa: 11 }, b: 2 }],
      ['inner signal a change', { aa: 1 }],
      ['mapped signal mutate', expectedTransactions2],
      ['mapped signal change', { a: { aa: 1 }, b: 2 }],
      ['atom mutate', expectedTransactions2],
      ['atom change', { a: { aa: 1 }, b: 2 }],
    ]

    expect(node1.get()).toEqual({ a: { aa: 1 }, b: 2 })
    expect(calls).toEqual(expectedSequence)
    calls.splice(0, calls.length)

    node1.mutate(state => {
      state.a.aa = 11
    })

    node1.mutate(state => {
      state.a.aa = 1
    })

    expect(node1.get()).toEqual({ a: { aa: 1 }, b: 2 })
    expect(calls).toEqual(expectedSequence)
  })

  test('mutating inner signals sends wrapped mutate events to outer signal', () => {
    const { calls, node1 } = setupNestedSignals()

    node1.exports.signalA.mutate(state => {
      state.aa = 11
    })

    const expectedTransactions1 = [{ k: ['a', 'aa'], v: 11 }]
    const expectedSequence = [
      ['inner signal a mutate', [{ k: 'aa', v: 11 }]],
      ['inner signal a change', { aa: 11 }],
      ['mapped signal mutate', expectedTransactions1],
      ['mapped signal change', { a: { aa: 11 }, b: 2 }],
      ['atom mutate', expectedTransactions1],
      ['atom change', { a: { aa: 11 }, b: 2 }],
    ]

    expect(node1.get()).toEqual({ a: { aa: 11 }, b: 2 })
    expect(calls).toEqual(expectedSequence)
  })

  test('mixed types', () => {
    const atom1 = atom('1', 'atom')
    const atom2 = ion('2', ({ getNode }) => {
      const node1 = getNode(atom1)
      const innerSignal = injectSignal(
        { aa: 1 },
        { events: { eventA: As<number> } }
      )
      const nestedSignal = injectMappedSignal({ bb: innerSignal })

      const signal = injectMappedSignal({
        a: innerSignal,
        b: nestedSignal,
        c: node1,
        d: 'string',
        e: 2,
      })

      return api(signal).setExports({ innerSignal, nestedSignal, signal })
    })

    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)
    const calls: any[] = []

    expectTypeOf<StateOf<typeof node2>>().toEqualTypeOf<{
      a: {
        aa: number
      }
      b: {
        bb: {
          aa: number
        }
      }
      c: string
      d: string
      e: number
    }>()

    expect(node2.get()).toEqual({
      a: {
        aa: 1,
      },
      b: {
        bb: {
          aa: 1,
        },
      },
      c: 'atom',
      d: 'string',
      e: 2,
    })

    node1.on('change', event => calls.push(['atom1 change', event.newState]))
    node2.on('change', event =>
      calls.push(['atom2 change', event.newState.b.bb.aa])
    )
    node2.exports.innerSignal.on('change', event =>
      calls.push(['innerSignal change', event.newState.aa])
    )
    node2.exports.nestedSignal.on('change', event =>
      calls.push(['nestedSignal change', event.newState.bb.aa])
    )
    node2.exports.signal.on('change', event =>
      calls.push(['signal change', event.newState.a.aa])
    )

    node2.set(state => ({
      ...state,
      a: {
        ...state.a,
        aa: 11,
      },
      c: 'atom 2',
      e: 3,
    }))

    expect(node2.get()).toEqual({
      a: {
        aa: 11,
      },
      b: {
        bb: {
          aa: 11,
        },
      },
      c: 'atom 2',
      d: 'string',
      e: 3,
    })

    expect(node1.get()).toBe('atom 2')

    expect(calls).toEqual([
      ['atom1 change', 'atom 2'],
      ['innerSignal change', 11],
      ['nestedSignal change', 11],
      ['signal change', 11],
      ['atom2 change', 11],
    ])
    calls.splice(0, calls.length)

    node2.mutate(state => {
      state.b.bb.aa = 111
      state.c = 'atom 3'
      state.d = 'string 2'
    })

    expect(node2.get()).toEqual({
      a: {
        aa: 111,
      },
      b: {
        bb: {
          aa: 111,
        },
      },
      c: 'atom 3',
      d: 'string 2',
      e: 3,
    })

    expect(node1.get()).toBe('atom 3')

    expect(calls).toEqual([
      ['atom1 change', 'atom 3'],
      ['innerSignal change', 111],
      ['nestedSignal change', 111],
      ['signal change', 111],
      ['atom2 change', 111],
    ])
  })

  test("updating a mapped signal during atom evaluation doesn't tear and eventually resolves", () => {
    const calls: any[] = []
    const atom1 = atom('1', () => 'a')

    const atom2 = atom('2', () => {
      const { get } = injectEcosystem()

      const a = get(atom1)
      const b = injectSignal('b')

      const mappedSignal = injectMappedSignal({ a, b })

      calls.push([b.get(), mappedSignal.get().b]) // no tearing

      if (mappedSignal.get().b.length % 2) {
        mappedSignal.mutate({ b: b.get() + 'b' })
      }

      calls.push(mappedSignal.get())

      return mappedSignal
    })

    const node2 = ecosystem.getNode(atom2)

    expect(node2.get()).toEqual({ a: 'a', b: 'bb' })
    expect(calls).toEqual([
      ['b', 'b'],
      { a: 'a', b: 'b' },
      ['bb', 'bb'],
      { a: 'a', b: 'bb' },
    ])
  })

  test('events that reach multiple inner signals are only propagated to observers of the mapped signal once', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const signal1 = injectSignal(1, { events: { test: As<string> } })
      const signal2 = injectSignal(2, { events: { test: As<string> } })

      return injectMappedSignal({
        1: signal1,
        2: signal2,
      })
    })

    const node1 = ecosystem.getNode(atom1)

    node1.on('test', event => calls.push(event))

    node1.send({ test: 'a' })

    expect(calls).toEqual(['a'])
  })
})
