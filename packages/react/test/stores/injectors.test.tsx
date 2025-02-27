import {
  EvaluationReason,
  injectAtomGetters,
  injectAtomInstance,
  injectAtomSelector,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectEcosystem,
  injectEffect,
  injectMemo,
  injectPromise,
  injectRef,
  injectSelf,
  injectWhy,
} from '@zedux/react'
import { api, atom, injectStore } from '@zedux/stores'
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
      injectStore,
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
      const store = injectStore('a')
      const val1 = injectMemo(() => store.getState())
      const val2 = injectMemo(() => store.getState(), [])
      const val3 = injectMemo(() => store.getState(), [store.getState()])
      vals.push(val1, val2, val3)

      const injectedRef = injectRef(ref)
      refs.push(injectedRef.current)

      const cb1 = injectCallback(store.getState() === 'a' ? cbA : cbB)
      const cb2 = injectCallback(store.getState() === 'a' ? cbA : cbB, [])
      const cb3 = injectCallback(store.getState() === 'a' ? cbA : cbB, [
        store.getState(),
      ])
      cbs.push(cb1(), cb2(), cb3())

      injectEffect(() => {
        effects.push(store.getState())

        return () => cleanups.push(store.getState())
      }, [store.getState()])

      return store
    })

    const instance = ecosystem.getInstance(atom1)

    instance.setState('b')

    expect(vals).toEqual(['a', 'a', 'a', 'a', 'a', 'b'])
    expect(cbs).toEqual(['aa', 'aa', 'aa', 'aa', 'aa', 'bb'])
    expect(effects).toEqual(['a', 'b'])
    expect(cleanups).toEqual(['b'])
    expect(refs).toEqual([ref, ref])

    instance.setState('c')

    expect(vals).toEqual(['a', 'a', 'a', 'a', 'a', 'b', 'a', 'a', 'c'])
    expect(cbs).toEqual(['aa', 'aa', 'aa', 'aa', 'aa', 'bb', 'aa', 'aa', 'bb'])
    expect(effects).toEqual(['a', 'b', 'c'])
    expect(cleanups).toEqual(['b', 'c'])
    expect(refs).toEqual([ref, ref, ref])
  })

  test('dynamic injectors subscribe to updates', () => {
    const vals: [string, number, number][] = []

    const atom1 = atom('1', () => 1)
    const atom2 = atom('2', () => {
      const store = injectStore(2)

      return api(store).setExports({
        set2: (val: number) => store.setState(val),
      })
    })

    const atom3 = atom('3', () => {
      const self = injectSelf()
      const store = injectStore('a')
      const one = injectAtomValue(atom1)
      const [two, setTwo] = injectAtomState(atom2)
      const { set2 } = setTwo

      vals.push([store.getState(), one, two])

      return api(store).setExports({
        invalidate: () => self.invalidate(),
        set2,
        setTwo,
      })
    })

    const instance = ecosystem.getInstance(atom3)

    expect(vals).toEqual([['a', 1, 2]])

    instance.setState('b')

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
      const [subscribe, setSubscribe] = injectAtomState(instance1)
      const store = injectStore('a', { subscribe })
      const instance2 = injectAtomInstance(atom2)

      vals.push([store.getState(), subscribe, instance2.getState()])

      return api(store).setExports({
        invalidate: () => self.invalidate(),
        setSubscribe,
        setTwo: instance2.setState,
      })
    })

    const instance = ecosystem.getInstance(atom3)

    expect(vals).toEqual([['a', true, 2]])

    instance.exports.setSubscribe(false)

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
    ])

    instance.exports.setTwo(22)

    expect(vals).toEqual([
      ['a', true, 2],
      ['a', false, 2],
    ])

    instance.exports.setSubscribe(true)

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
    const getInstanceValue = instance.exports.getInstance(atom1).getState()
    const selectValue = instance.exports.select(selector1)

    expect(getValue).toBe('a')
    expect(getInstanceValue).toBe('a')
    expect(selectValue).toBe(1)
    expect(ecosystem.viewGraph()).toEqual({
      1: {
        observers: [],
        sources: [],
        weight: 1,
      },
      '@@selector-selector1-0': {
        observers: [],
        sources: [],
        weight: 1,
      },
    })
  })

  test('injectEcosystem() methods do nothing after evaluation is over', () => {
    const atom1 = atom('1', () => {
      const { get, getNode } = injectEcosystem()

      return api('a').setExports({ get, getNode })
    })

    const selector1 = () => 1

    const instance = ecosystem.getNode(atom1)
    const getValue = instance.exports.get(atom1)
    const getNodeValue = instance.exports.getNode(atom1).getState()
    const selectValue = instance.exports.get(selector1)

    expect(getValue).toBe('a')
    expect(getNodeValue).toBe('a')
    expect(selectValue).toBe(1)
    expect(ecosystem.viewGraph()).toEqual({
      1: {
        observers: [],
        sources: [],
        weight: 1,
      },
      '@@selector-selector1-0': {
        observers: [],
        sources: [],
        weight: 1,
      },
    })
  })

  test('injectWhy() is an alias of ecosystem.why() during atom evaluation', () => {
    const whys: (EvaluationReason[] | undefined)[] = []

    const atom1 = atom('1', () => {
      const store = injectStore('a')
      const { ecosystem } = injectAtomGetters()

      whys.push(injectWhy())
      whys.push(ecosystem.why())

      return store
    })

    const instance1 = ecosystem.getInstance(atom1)

    expect(whys).toEqual([[], []])

    instance1.setState('b')

    expect(whys).toEqual([
      [],
      [],
      [
        {
          newState: 'b',
          oldState: 'a',
          operation: undefined,
          reasons: undefined,
          source: undefined,
          type: 'change',
        },
      ],
      [
        {
          newState: 'b',
          oldState: 'a',
          operation: undefined,
          reasons: undefined,
          source: undefined,
          type: 'change',
        },
      ],
    ])
    expect(whys[2]).toEqual(whys[3])
  })
})
