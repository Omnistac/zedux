import { api, atom, injectSignal } from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'

describe('proxies', () => {
  test('set operations', () => {
    const calls: any[] = []
    const initialObj = { a: [new Set('b')], id: 1 }
    const signal = ecosystem.signal(new Set([initialObj]))

    signal.on('mutate', (transactions, { change }) => {
      calls.push([transactions, change?.newState])
    })

    signal.mutate(state => {
      state.add({ a: [], id: 2 })
    })

    const expectedState1 = new Set([initialObj, { a: [], id: 2 }])

    expect(signal.get()).toEqual(expectedState1)

    expect(calls).toEqual([
      [[{ k: { a: [], id: 2 }, v: undefined }], expectedState1],
    ])
    calls.splice(0, calls.length)

    signal.mutate(state => {
      state.delete(initialObj)
    })

    const expectedState2 = new Set([{ a: [], id: 2 }])

    expect(signal.get()).toEqual(expectedState2)

    expect(calls).toEqual([[[{ k: initialObj, t: 'd' }], expectedState2]])
    calls.splice(0, calls.length)

    signal.mutate(state => state.clear())

    expect(signal.get()).toEqual(new Set())
    expect(calls).toEqual([[[{ k: { a: [], id: 2 }, t: 'd' }], new Set()]])
    calls.splice(0, calls.length)

    signal.mutate(state => {
      if (state.has(initialObj) || state.size === 0) state.delete(initialObj)
    })

    expect(signal.get()).toEqual(new Set())
    expect(calls).toEqual([])
  })

  test('array operations', () => {
    const calls: any[] = []
    const signal = ecosystem.signal([{ a: [1, 3] }])

    signal.on('mutate', (transactions, { change }) => {
      calls.push([transactions, change?.newState])
    })

    signal.mutate([{ a: [11, 33] }])

    expect(signal.get()).toEqual([{ a: [11, 33] }])

    signal.mutate(state => {
      state.push({ a: [2] }, { a: [200] })
    })

    expect(signal.get()).toEqual([{ a: [11, 33] }, { a: [2] }, { a: [200] }])

    signal.mutate(state => {
      state.splice(1, 1)
    })

    expect(signal.get()).toEqual([{ a: [11, 33] }, { a: [200] }])

    signal.mutate(state => {
      state.unshift({ a: [3] })
      state.splice(1, 1, { a: [300] })
    })

    expect(signal.get()).toEqual([{ a: [3] }, { a: [300] }, { a: [200] }])

    signal.mutate(state => {
      if (state.length > 2) {
        state.shift()
        state[1].a.push(201)
        state[0].a = []
      }
    })

    expect(signal.get()).toEqual([{ a: [] }, { a: [200, 201] }])

    signal.mutate(state => {
      const val = state.pop()
      state.splice(0, 0, val!)

      // if it's valid JS, it's a valid mutation/transaction
      state.splice(10, 10, { a: [400] })
    })

    expect(signal.get()).toEqual([{ a: [200, 201] }, { a: [] }, { a: [400] }])

    signal.mutate(state => {
      const symbol = state[Symbol.iterator]
      expect(symbol).toBe(Array.prototype[Symbol.iterator])
    })

    expect(calls).toMatchSnapshot()
  })

  test('object operations', () => {
    const calls: any[] = []
    const signal = ecosystem.signal({ a: { b: 'b' }, c: null as any })

    signal.on('mutate', (transactions, { change }) => {
      calls.push([transactions, change?.newState])
    })

    signal.mutate(state => ({ a: { b: state.a.b + 'b' } }))

    expect(signal.get()).toEqual({ a: { b: 'bb' }, c: null })

    signal.mutate({ c: { d: 'd' } })

    expect(signal.get()).toEqual({ a: { b: 'bb' }, c: { d: 'd' } })

    signal.mutate(state => {
      delete state.c
    })

    expect(signal.get()).toEqual({ a: { b: 'bb' } })

    signal.mutate(state => {
      state.c = undefined
      state.a.b += 'b'
    })

    expect(signal.get()).toEqual({ a: { b: 'bbb' }, c: undefined })

    expect(calls).toMatchSnapshot()
  })

  test('unsupported operations throw', () => {
    const signal = ecosystem.signal(['a', 'z', 'b', 'y'])
    const pattern = /This operation is not supported/

    expect(() => signal.mutate(state => state.reverse())).toThrow(pattern)

    expect(() => signal.mutate(state => state.sort())).toThrow(pattern)

    expect(() =>
      signal.mutate(state => {
        delete state[0]
      })
    ).toThrow(pattern)

    const setSignal = ecosystem.signal(new Set())

    expect(() =>
      setSignal.mutate(state => {
        // @ts-expect-error can't assign to a set
        state.nothing = 'nothing'
      })
    ).toThrow(pattern)
  })

  test('Zedux recursively proxies a returned object only if no transactions were added', () => {
    const calls: any[] = []
    const signal = ecosystem.signal({ a: { b: 'b' } })

    signal.on('mutate', (transactions, { change }) => {
      calls.push([transactions, change?.newState])
    })

    signal.mutate(state => {
      state.a.b = 'bb'

      return { a: { b: 'ignored' } }
    })

    expect(signal.get()).toEqual({ a: { b: 'bb' } })
    expect(calls).toEqual([[[{ k: ['a', 'b'], v: 'bb' }], { a: { b: 'bb' } }]])
    calls.splice(0, calls.length)

    signal.mutate(state => {
      state.a.b

      return { a: { b: 'not ignored' } }
    })

    expect(signal.get()).toEqual({ a: { b: 'not ignored' } })
    expect(calls).toEqual([
      [[{ k: ['a', 'b'], v: 'not ignored' }], { a: { b: 'not ignored' } }],
    ])
  })

  test('shorthand allows overwriting a set', () => {
    const atom1 = atom('1', () => {
      const signal = injectSignal(
        {
          arr: [] as string[],
          set: new Set<string>(),
        },
        { reactive: false }
      )

      return api(signal).setExports({
        mutate: (...args: Parameters<typeof signal.mutate>) =>
          signal.mutate(...args),
      })
    })

    const instance1 = ecosystem.getNode(atom1)

    const calls: any[] = []
    instance1.on('mutate', (transactions, { change }) => {
      calls.push([transactions, change?.newState])
    })

    instance1.exports.mutate(draft => {
      const { set, arr } = draft
      draft.arr = [...arr, 'a']
      draft.set = new Set([...set, 'a'])
    })

    instance1.exports.mutate(draft => {
      const { set, arr } = draft

      return {
        arr: [...arr, 'b'],
        set: new Set([...set, 'b']),
      }
    })

    const { set, arr } = instance1.get()

    instance1.exports.mutate({
      arr: [...arr, 'c'],
      set: new Set([...set, 'c']),
    })

    instance1.exports.mutate(draft => {
      draft.arr.push('d')
      draft.set.add('d')
    })

    expect(instance1.get()).toEqual({
      arr: ['a', 'b', 'c', 'd'],
      set: new Set(['a', 'b', 'c', 'd']),
    })

    expect(calls).toEqual([
      [
        [
          { k: 'arr', v: ['a'] },
          { k: 'set', v: new Set(['a']) },
        ],
        { arr: ['a'], set: new Set(['a']) },
      ],
      [
        [
          { k: ['arr', '1'], v: 'b' },
          { k: ['set', 'b'], v: undefined },
        ],
        {
          arr: ['a', 'b'],
          set: new Set(['a', 'b']),
        },
      ],
      [
        [
          { k: ['arr', '2'], v: 'c' },
          { k: ['set', 'c'], v: undefined },
        ],
        {
          arr: ['a', 'b', 'c'],
          set: new Set(['a', 'b', 'c']),
        },
      ],
      [
        [
          { k: ['arr', 3], v: 'd' },
          { k: ['set', 'd'], v: undefined },
        ],
        {
          arr: ['a', 'b', 'c', 'd'],
          set: new Set(['a', 'b', 'c', 'd']),
        },
      ],
    ])
  })

  test('a top-level set can be mutated', () => {
    const signal = ecosystem.signal(new Set([1, 2, 3]))

    signal.mutate(state => {
      state.add(4)
    })

    signal.mutate(new Set([2, 3]))
    expect(signal.get()).toEqual(new Set([2, 3]))

    signal.mutate(new Set([4]))
    expect(signal.get()).toEqual(new Set([4]))
  })

  test('a top-level array can be mutated', () => {
    const signal = ecosystem.signal([1, 2, 3])

    signal.mutate(state => {
      state.push(4, 5)
    })

    signal.mutate(draft => [draft[0] + 1, draft[1] + 1])
    signal.mutate({ 2: 30, 3: 40 })

    expect(signal.get()).toEqual([2, 3, 30, 40, 5])
  })

  describe('recursivelyMutate optimizations', () => {
    test('skips recursion when object references match', () => {
      const calls: any[] = []
      const nested = { deep: 'value' }
      const signal = ecosystem.signal({ a: nested })

      signal.on('mutate', transactions => {
        calls.push(transactions)
      })

      // Passing the same object reference should not create any transactions
      signal.mutate({ a: nested })

      expect(calls).toEqual([])
    })

    test('does not create transactions for unchanged primitive values', () => {
      const calls: any[] = []
      const signal = ecosystem.signal({ a: 1, b: 'hello' })

      signal.on('mutate', transactions => {
        calls.push(transactions)
      })

      // Setting same values should not create transactions
      signal.mutate({ a: 1, b: 'hello' })

      expect(calls).toEqual([])
    })

    test('minimizes proxy getter calls', () => {
      const signal = ecosystem.signal({ a: { b: 1 } })

      // We can't directly count proxy getter calls, but we can verify
      // the optimization works by checking no unnecessary transactions are created
      // when values match. This test documents the expected behavior.
      const calls: any[] = []
      signal.on('mutate', transactions => {
        calls.push(transactions)
      })

      // When a nested object is the same reference, no recursion should happen
      const currentA = signal.get().a
      signal.mutate({ a: currentA })

      expect(calls).toEqual([])
    })

    test('handles array shorthand mutations correctly', () => {
      const calls: any[] = []
      const signal = ecosystem.signal({ arr: [1, 2, 3] })

      signal.on('mutate', transactions => {
        calls.push(transactions)
      })

      // Array shorthand should work and only create transactions for changed indices
      signal.mutate({ arr: { 2: 30 } })
      signal.mutate({ arr: [11, 21] })

      expect(signal.get()).toEqual({ arr: [11, 21, 30] })
      expect(calls).toEqual([
        [{ k: ['arr', '2'], v: 30 }],
        [
          { k: ['arr', '0'], v: 11 },
          { k: ['arr', '1'], v: 21 },
        ],
      ])
    })
  })
})
