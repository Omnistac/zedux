import {
  EvaluationReason,
  StateOf,
  api,
  atom,
  injectAtomGetters,
  injectAtomInstance,
  injectAtomSelector,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectEffect,
  injectMemo,
  injectPromise,
  injectRef,
  injectSelf,
  injectSignal,
  injectWhy,
} from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

describe('injectors', () => {
  test('injectors can only be called during atom evaluation', () => {
    ;[
      injectAtomGetters,
      injectAtomInstance,
      injectAtomSelector,
      injectAtomState,
      injectAtomValue,
      injectCallback,
      injectEffect,
      injectMemo,
      injectPromise,
      injectRef,
      injectSelf,
      injectSignal,
      injectWhy,
    ].forEach(injector => {
      expect(injector).toThrowError(
        /injectors can only be used in atom state factories/i
      )
    })
  })

  test('React-esque injectors mimic React hook functionality', () => {
    const ref = {}
    const cbs: string[] = []
    const cleanups: string[] = []
    const effects: string[] = []
    const refs: (typeof ref)[] = []
    const vals: string[] = []
    const cbA = () => 'aa'
    const cbB = () => 'bb'

    const atom1 = atom('1', () => {
      const signal = injectSignal('a')
      const val1 = injectMemo(() => signal.get())
      const val2 = injectMemo(() => signal.get(), [])
      const val3 = injectMemo(() => signal.get(), [signal.get()])
      vals.push(val1, val2, val3)

      const injectedRef = injectRef(ref)
      refs.push(injectedRef.current)

      const cb1 = injectCallback(signal.get() === 'a' ? cbA : cbB)
      const cb2 = injectCallback(signal.get() === 'a' ? cbA : cbB, [])
      const cb3 = injectCallback(signal.get() === 'a' ? cbA : cbB, [
        signal.get(),
      ])
      cbs.push(cb1(), cb2(), cb3())

      injectEffect(() => {
        effects.push(signal.get())

        return () => cleanups.push(signal.get())
      }, [signal.get()])

      return signal
    })

    const instance = ecosystem.getInstance(atom1)

    instance.set('b')

    // all those `get` calls shouldn't add any edges besides the one already
    // added by `injectSignal`:
    expect(instance.s.size).toBe(1)
    expect(vals).toEqual(['a', 'a', 'a', 'b', 'a', 'b'])
    expect(cbs).toEqual(['aa', 'aa', 'aa', 'bb', 'aa', 'bb'])
    expect(effects).toEqual(['a', 'b'])
    expect(cleanups).toEqual(['b'])
    expect(refs).toEqual([ref, ref])

    instance.set('c')

    expect(vals).toEqual(['a', 'a', 'a', 'b', 'a', 'b', 'c', 'a', 'c'])
    expect(cbs).toEqual(['aa', 'aa', 'aa', 'bb', 'aa', 'bb', 'bb', 'aa', 'bb'])
    expect(effects).toEqual(['a', 'b', 'c'])
    expect(cleanups).toEqual(['b', 'c'])
    expect(refs).toEqual([ref, ref, ref])
  })

  test('dynamic injectors subscribe to updates', () => {
    const vals: [string, number, number][] = []

    const atom1 = atom('1', () => 1)
    const atom2 = atom('2', () => {
      const signal = injectSignal(2)

      return api(signal).setExports({
        set2: (val: number) => signal.set(val),
      })
    })

    const atom3 = atom('3', () => {
      const self = injectSelf()
      const signal = injectSignal('a')
      const one = injectAtomValue(atom1)
      const [two, setTwo] = injectAtomState(atom2)
      const { set2 } = setTwo

      vals.push([signal.get(), one, two])

      return api(signal).setExports({
        invalidate: () => self.invalidate(),
        set2,
        setTwo,
      })
    })

    const instance = ecosystem.getInstance(atom3)

    expect(vals).toEqual([['a', 1, 2]])

    instance.set('b')

    expect(vals).toEqual([
      ['a', 1, 2],
      ['b', 1, 2],
    ])

    instance.exports.set2(22)

    expect(vals).toEqual([
      ['a', 1, 2],
      ['b', 1, 2],
      ['b', 1, 22],
    ])

    instance.exports.setTwo(222)

    expect(vals).toEqual([
      ['a', 1, 2],
      ['b', 1, 2],
      ['b', 1, 22],
      ['b', 1, 222],
    ])
  })

  test("static injectors don't subscribe to updates", () => {
    const vals: [string, boolean, number][] = []

    const atom1 = atom('1', () => true)
    const atom2 = atom('2', () => 2)

    const atom3 = atom('3', () => {
      const self = injectSelf()
      const instance1 = injectAtomInstance(atom1)
      const [isReactive, setIsReactive] = injectAtomState(instance1)
      const signal = injectSignal('a', { reactive: isReactive })
      const instance2 = injectAtomInstance(atom2)

      vals.push([signal.get(), isReactive, instance2.getOnce()])

      return api(signal).setExports({
        invalidate: () => self.invalidate(),
        setIsReactive,
        setTwo: (val: StateOf<typeof instance2>) => instance2.set(val),
      })
    })

    const instance = ecosystem.getInstance(atom3)

    expect(vals).toEqual([['a', true, 2]])

    instance.exports.setIsReactive(false)

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
    ])

    instance.exports.setTwo(22)

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
    ])

    instance.exports.setIsReactive(true)

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
      ['a', true, 22],
    ])

    instance.exports.invalidate()

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
      ['a', true, 22],
      ['a', true, 22],
    ])
  })

  test('injected AtomGetters do nothing after evaluation is over', () => {
    const atom1 = atom('1', () => {
      const { get, getInstance, select } = injectAtomGetters()

      return api('a').setExports({ get, getInstance, select })
    })

    const selector1 = () => 1

    const instance = ecosystem.getInstance(atom1)
    const getValue = instance.exports.get(atom1)
    const getInstanceValue = instance.exports.getInstance(atom1).get()
    const selectValue = instance.exports.select(selector1)

    expect(getValue).toBe('a')
    expect(getInstanceValue).toBe('a')
    expect(selectValue).toBe(1)
    expect(ecosystem.viewGraph()).toEqual({
      1: {
        dependencies: [],
        dependents: [],
        weight: 1,
      },
      '@@selector-selector1-0': {
        dependencies: [],
        dependents: [],
        weight: 1,
      },
    })
  })

  test('injectWhy() is an alias of ecosystem.why() during atom evaluation', () => {
    const whys: (EvaluationReason[] | undefined)[] = []

    const atom1 = atom('1', () => {
      const signal = injectSignal('a')
      const { ecosystem } = injectAtomGetters()

      whys.push(injectWhy())
      whys.push(ecosystem.why())

      return signal
    })

    const instance1 = ecosystem.getInstance(atom1)

    expect(whys).toEqual([[], []])

    instance1.set('b')

    expect(whys).toEqual([
      [],
      [],
      [
        {
          newState: 'b',
          oldState: 'a',
          operation: 'injectSignal',
          reasons: [],
          source: ecosystem.find('@signal(1)'),
          type: 'change',
        },
      ],
      [
        {
          newState: 'b',
          oldState: 'a',
          operation: 'injectSignal',
          reasons: [],
          source: ecosystem.find('@signal(1)'),
          type: 'change',
        },
      ],
    ])
    expect(whys[2]).toEqual(whys[3])
  })

  test('injectMemo() callback does not track signal usages', () => {
    const signal = ecosystem.signal(0)

    const atom1 = atom('1', () => {
      return injectMemo(() => signal.get(), [signal.getOnce()])
    })

    const node1 = ecosystem.getNode(atom1)

    expect(node1.get()).toBe(0)

    signal.set(1)

    expect(node1.get()).toBe(0)
  })

  test('injectEffect() callback does not track signal usages', () => {
    const signal = ecosystem.signal(0)

    const atom1 = atom('1', () => {
      injectEffect(
        () => {
          signal.get()
        },
        [signal.getOnce()],
        { synchronous: true }
      )

      return signal.getOnce()
    })

    const node1 = ecosystem.getNode(atom1)

    expect(node1.get()).toBe(0)

    signal.set(1)

    expect(node1.get()).toBe(0)
  })
})
