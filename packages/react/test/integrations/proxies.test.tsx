import { api, As, atom, injectSignal, Transaction } from '@zedux/atoms'
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
          { k: 'arr', v: ['a', 'b'] },
          { k: ['set', 'b'], v: undefined },
        ],
        {
          arr: ['a', 'b'],
          set: new Set(['a', 'b']),
        },
      ],
      [
        [
          { k: 'arr', v: ['a', 'b', 'c'] },
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
    signal.mutate(state => {
      state[2] = 30
      state[3] = 40
    })

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

      // Array shorthand fully replaces the array instead of deep merging
      signal.mutate({ arr: [11, 21] })

      expect(signal.get()).toEqual({ arr: [11, 21] })
      expect(calls).toEqual([[{ k: 'arr', v: [11, 21] }]])
    })
  })

  describe('non-plain object handling', () => {
    test('mutate sets state directly when oldState is a primitive (number)', () => {
      const signal = ecosystem.signal<any>(42)

      signal.mutate(100)

      expect(signal.get()).toBe(100)
    })

    test('mutate sets state directly when oldState is a primitive (string)', () => {
      const signal = ecosystem.signal<any>('hello')

      signal.mutate('world')

      expect(signal.get()).toBe('world')
    })

    test('mutate sets state directly when oldState is a primitive (boolean)', () => {
      const signal = ecosystem.signal<any>(false)

      signal.mutate(true)

      expect(signal.get()).toBe(true)
    })

    test('mutate with function form works when oldState is a primitive', () => {
      const signal = ecosystem.signal<any>(10)

      signal.mutate((state: any) => state + 5)

      expect(signal.get()).toBe(15)
    })

    test('mutate can change primitive state to an object', () => {
      const signal = ecosystem.signal<any>(42)

      signal.mutate({ a: 1 })

      expect(signal.get()).toEqual({ a: 1 })
    })

    test('returning a non-mutatable value from callback sets entire state', () => {
      const signal = ecosystem.signal<any>({ a: 1 })

      signal.mutate(() => 42)

      expect(signal.get()).toBe(42)
    })

    test('returning void from callback does not set state', () => {
      const signal = ecosystem.signal<any>({ a: 1 })

      signal.mutate((state: any) => {
        state.a = 2
      })

      expect(signal.get()).toEqual({ a: 2 })
    })

    test('returning non-mutatable is ignored when proxy mutations were made', () => {
      const signal = ecosystem.signal<any>({ a: 1, b: 2 })

      signal.mutate((state: any) => {
        state.a = 10
        return 42 // ignored because proxy mutations were tracked
      })

      expect(signal.get()).toEqual({ a: 10, b: 2 })
    })

    test('mutate sets state directly when oldState is a Date', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2025-01-01')
      const signal = ecosystem.signal<any>(date1)

      signal.mutate(date2)

      expect(signal.get()).toBe(date2)
    })

    test('mutate sets state directly when oldState is a class instance', () => {
      class MyClass {
        constructor(public value: number) {}
      }

      const signal = ecosystem.signal<any>(new MyClass(1))

      signal.mutate(new MyClass(2))

      expect(signal.get()).toBeInstanceOf(MyClass)
      expect(signal.get().value).toBe(2)
    })

    test('mutate with function form works when oldState is a class instance', () => {
      class Counter {
        constructor(public count: number) {}
      }

      const signal = ecosystem.signal<any>(new Counter(1))

      signal.mutate((state: Counter) => new Counter(state.count + 1))

      expect(signal.get()).toBeInstanceOf(Counter)
      expect(signal.get().count).toBe(2)
    })

    test('mutate sets state directly when oldState is a RegExp', () => {
      const signal = ecosystem.signal<any>(/foo/)

      signal.mutate(/bar/i)

      expect(signal.get()).toEqual(/bar/i)
    })

    test('mutate sets state directly when oldState is a Map', () => {
      const map1 = new Map([['a', 1]])
      const map2 = new Map([['b', 2]])
      const signal = ecosystem.signal<any>(map1)

      signal.mutate(map2)

      expect(signal.get()).toBe(map2)
    })

    test('mutate forwards events when oldState is non-mutatable', () => {
      const signal = ecosystem.signal(42 as any, {
        events: { custom: As<string> },
      })
      let receivedCustom: string | undefined
      let receivedTransactions: Transaction[] | undefined

      signal.on('custom', val => {
        receivedCustom = val
      })

      signal.on('mutate', t => {
        receivedTransactions = t
      })

      signal.mutate(100, { custom: 'hello' })

      expect(signal.get()).toBe(100)
      expect(receivedCustom).toBe('hello')
      expect(receivedTransactions).toEqual([])
    })

    test('nested non-plain objects are assigned directly, not recursed into', () => {
      const date = new Date('2024-01-01')
      const signal = ecosystem.signal<any>({ a: date, b: 'keep' })
      const calls: any[] = []

      signal.on('mutate', transactions => {
        calls.push(transactions)
      })

      const newDate = new Date('2025-01-01')
      signal.mutate({ a: newDate })

      expect(signal.get()).toEqual({ a: newDate, b: 'keep' })
      expect(signal.get().a).toBe(newDate)
      // should create a simple assignment transaction, not recurse
      expect(calls).toEqual([[{ k: 'a', v: newDate }]])
    })

    test('nested class instances are assigned directly', () => {
      class Coord {
        constructor(public x: number, public y: number) {}
      }

      const signal = ecosystem.signal<any>({
        pos: new Coord(0, 0),
        name: 'origin',
      })

      const newCoord = new Coord(1, 2)
      signal.mutate({ pos: newCoord })

      expect(signal.get().pos).toBe(newCoord)
      expect(signal.get().pos).toBeInstanceOf(Coord)
    })

    test('nested RegExp is assigned directly', () => {
      const signal = ecosystem.signal<any>({ pattern: /foo/, value: 1 })

      signal.mutate({ pattern: /bar/i })

      expect(signal.get()).toEqual({ pattern: /bar/i, value: 1 })
    })

    test('nested Map is assigned directly', () => {
      const map1 = new Map([['a', 1]])
      const map2 = new Map([['b', 2]])
      const signal = ecosystem.signal<any>({ data: map1 })

      signal.mutate({ data: map2 })

      expect(signal.get().data).toBe(map2)
    })

    test('replacing a plain object with a class instance assigns directly', () => {
      class Config {
        constructor(public setting: string) {}
      }

      const signal = ecosystem.signal<any>({ config: { setting: 'a' } })

      const newConfig = new Config('b')
      signal.mutate({ config: newConfig })

      expect(signal.get().config).toBe(newConfig)
      expect(signal.get().config).toBeInstanceOf(Config)
    })

    test('replacing a class instance with a plain object assigns directly', () => {
      class Config {
        constructor(public setting: string) {}
      }

      const signal = ecosystem.signal<any>({ config: new Config('a') })

      signal.mutate({ config: { setting: 'b' } })

      const result = signal.get().config
      expect(result).toEqual({ setting: 'b' })
      expect(result).not.toBeInstanceOf(Config)
    })

    test('plain object replaces array via shorthand', () => {
      const signal = ecosystem.signal<any>({ data: [1, 2, 3] })

      signal.mutate({ data: { a: 10 } })

      // plain object fully replaces the array
      expect(signal.get().data).toEqual({ a: 10 })
    })

    test('replacing a plain object with an array assigns directly', () => {
      const signal = ecosystem.signal<any>({ data: { a: 1 } })

      signal.mutate({ data: [1, 2, 3] })

      expect(signal.get().data).toEqual([1, 2, 3])
    })

    test('replacing an array with a Set assigns directly', () => {
      const signal = ecosystem.signal<any>({ data: [1, 2] })

      signal.mutate({ data: new Set([3, 4]) })

      expect(signal.get().data).toEqual(new Set([3, 4]))
    })

    test('replacing a Set with a plain object assigns directly', () => {
      const signal = ecosystem.signal<any>({ data: new Set([1, 2]) })

      signal.mutate({ data: { a: 1 } })

      expect(signal.get().data).toEqual({ a: 1 })
    })

    test('same-type mutatable values still recurse correctly', () => {
      const signal = ecosystem.signal({
        nested: { a: 1, b: 2 },
        arr: [10, 20],
        set: new Set([1, 2]),
      })

      signal.mutate({ nested: { a: 100 } })
      expect(signal.get().nested).toEqual({ a: 100, b: 2 })

      signal.mutate({ arr: [11] })
      expect(signal.get().arr).toEqual([11])

      signal.mutate({ set: new Set([2, 3]) })
      expect(signal.get().set).toEqual(new Set([2, 3]))
    })

    test('deeply nested non-plain objects are assigned directly', () => {
      const signal = ecosystem.signal<any>({
        level1: {
          level2: {
            date: new Date('2024-01-01'),
            value: 'keep',
          },
        },
      })

      const newDate = new Date('2025-06-15')
      signal.mutate({ level1: { level2: { date: newDate } } })

      expect(signal.get().level1.level2.date).toBe(newDate)
      expect(signal.get().level1.level2.value).toBe('keep')
    })

    test('function form callback return of non-mutatable sets entire state', () => {
      const date = new Date('2025-01-01')
      const signal = ecosystem.signal<any>({ a: 1 })

      signal.mutate(() => date)

      expect(signal.get()).toBe(date)
    })

    test('returning null from callback sets state to null', () => {
      const signal = ecosystem.signal<any>({ a: 1 })

      signal.mutate(() => null)

      expect(signal.get()).toBeNull()
    })

    test('null-state branch skips transaction generation for non-mutatable newState', () => {
      const signal = ecosystem.signal<any>(null)
      let transactions: Transaction[] | undefined

      signal.on('mutate', t => {
        transactions = t
      })

      const date = new Date('2024-01-01')
      signal.mutate(date)

      expect(signal.get()).toBe(date)
      // should have empty transactions since Date is not mutatable
      expect(transactions).toEqual([])
    })

    test('null-state branch with function returning non-mutatable value', () => {
      const signal = ecosystem.signal<any>(null)

      signal.mutate(() => 42)

      expect(signal.get()).toBe(42)
    })

    test('null-state branch with function returning a class instance', () => {
      class Model {
        constructor(public id: number) {}
      }

      const signal = ecosystem.signal<any>(null)
      let transactions: Transaction[] | undefined

      signal.on('mutate', t => {
        transactions = t
      })

      signal.mutate(() => new Model(1))

      expect(signal.get()).toBeInstanceOf(Model)
      expect(signal.get().id).toBe(1)
      expect(transactions).toEqual([])
    })

    test('mixed nested types: plain objects recurse while class instances assign', () => {
      class Tag {
        constructor(public name: string) {}
      }

      const signal = ecosystem.signal<any>({
        user: { name: 'Alice', age: 30 },
        tag: new Tag('admin'),
        scores: [100, 200],
      })

      signal.mutate({
        user: { name: 'Bob' },
        tag: new Tag('user'),
        scores: [150],
      })

      // plain object: recursively merged (age preserved)
      expect(signal.get().user).toEqual({ name: 'Bob', age: 30 })
      // class instance: directly assigned
      expect(signal.get().tag).toBeInstanceOf(Tag)
      expect(signal.get().tag.name).toBe('user')
      // array: fully replaced (no deep merge)
      expect(signal.get().scores).toEqual([150])
    })

    test('proxy does not wrap non-plain objects when accessed via getter', () => {
      const date = new Date('2024-01-01')
      const signal = ecosystem.signal<any>({ date, count: 0 })

      signal.mutate((state: any) => {
        // accessing state.date should return the raw Date, not a proxy
        expect(state.date).toBe(date)
        state.count = 1
      })

      expect(signal.get().count).toBe(1)
      expect(signal.get().date).toBe(date)
    })
  })
})
