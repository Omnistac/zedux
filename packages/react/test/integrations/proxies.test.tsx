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
})
