import { Signal } from '@zedux/atoms/classes/Signal'
import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  api,
  atom,
  AtomApi,
  ExportsOf,
  AtomGetters,
  AtomInstance,
  AtomInstanceRecursive,
  NodeOf,
  ParamsOf,
  PromiseOf,
  StateOf,
  AtomTemplateRecursive,
  TemplateOf,
  AtomTuple,
  injectAtomInstance,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectMemo,
  injectPromise,
  ion,
  IonTemplateRecursive,
  ParamlessTemplate,
  PromiseState,
  injectSignal,
  EventsOf,
  As,
  None,
  Transaction,
  ChangeEvent,
  CycleEvent,
  InvalidateEvent,
  PromiseChangeEvent,
} from '@zedux/react'
import { expectTypeOf } from 'expect-type'
import { ecosystem, snapshotNodes } from './utils/ecosystem'

const exampleEvents = {
  numEvent: As<number>,
  strEvent: As<string>,
}

type ExampleEvents = {
  [K in keyof typeof exampleEvents]: ReturnType<(typeof exampleEvents)[K]>
}

const exampleAtom = atom('example', (p: string) => {
  const signal = injectSignal(p, {
    events: exampleEvents,
  })

  return api(signal)
    .setExports({
      getBool: () => Boolean(signal.get()),
      getNum: () => Number(signal.get()),
    })
    .setPromise(Promise.resolve(2))
})

afterEach(() => {
  ecosystem.reset()
})

describe('react types', () => {
  test('atom generic getters', () => {
    const instance = ecosystem.getInstance(exampleAtom, ['a'])

    type AtomState = StateOf<typeof exampleAtom>
    type AtomParams = ParamsOf<typeof exampleAtom>
    type AtomExports = ExportsOf<typeof exampleAtom>
    type AtomPromise = PromiseOf<typeof exampleAtom>
    type AtomEvents = EventsOf<typeof exampleAtom>

    type AtomInstanceState = StateOf<typeof instance>
    type AtomInstanceParams = ParamsOf<typeof instance>
    type AtomInstanceExports = ExportsOf<typeof instance>
    type AtomInstancePromise = PromiseOf<typeof instance>
    type AtomInstanceStore = EventsOf<typeof instance>

    type TAtomInstance = NodeOf<typeof exampleAtom>
    type TAtomTemplate = TemplateOf<typeof instance>

    expectTypeOf<AtomState>().toBeString()
    expectTypeOf<AtomState>().toEqualTypeOf<AtomInstanceState>()

    expectTypeOf<AtomParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParams>().toEqualTypeOf<AtomInstanceParams>()

    expectTypeOf<AtomExports>().toHaveProperty('getNum').toBeFunction()
    expectTypeOf<AtomExports>()
      .toHaveProperty('getNum')
      .parameters.toEqualTypeOf<[]>()
    expectTypeOf<AtomExports>().toHaveProperty('getNum').returns.toBeNumber()
    expectTypeOf<AtomExports>().toEqualTypeOf<AtomInstanceExports>()

    expectTypeOf<AtomPromise>().resolves.toBeNumber()
    expectTypeOf<AtomPromise>().toEqualTypeOf<AtomInstancePromise>()

    expectTypeOf<AtomEvents>().toEqualTypeOf<ExampleEvents>()
    expectTypeOf<AtomEvents>().toEqualTypeOf<AtomInstanceStore>()

    expectTypeOf<TAtomInstance>().toEqualTypeOf<typeof instance>()
    expectTypeOf<TAtomTemplate>().toEqualTypeOf<typeof instance.t>()
  })

  test('non-atom-api inference in atoms', () => {
    const signalAtom = atom('signal', (p: string) => injectSignal(p))
    const valueAtom = atom('value', (p: string) => p)

    const signalInstance = ecosystem.getInstance(signalAtom, ['a'])
    const valueInstance = ecosystem.getInstance(valueAtom, ['a'])

    type SignalAtomState = StateOf<typeof signalAtom>
    type SignalAtomParams = ParamsOf<typeof signalAtom>
    type SignalAtomExports = ExportsOf<typeof signalAtom>
    type SignalAtomPromise = PromiseOf<typeof signalAtom>
    type SignalAtomEvents = EventsOf<typeof signalAtom>
    type ValueAtomState = StateOf<typeof valueAtom>
    type ValueAtomParams = ParamsOf<typeof valueAtom>
    type ValueAtomExports = ExportsOf<typeof valueAtom>
    type ValueAtomPromise = PromiseOf<typeof valueAtom>
    type ValueAtomEvents = EventsOf<typeof valueAtom>

    type SignalAtomInstanceState = StateOf<typeof signalInstance>
    type SignalAtomInstanceParams = ParamsOf<typeof signalInstance>
    type SignalAtomInstanceExports = ExportsOf<typeof signalInstance>
    type SignalAtomInstancePromise = PromiseOf<typeof signalInstance>
    type SignalAtomInstanceEvents = EventsOf<typeof signalInstance>
    type ValueAtomInstanceState = StateOf<typeof signalInstance>
    type ValueAtomInstanceParams = ParamsOf<typeof signalInstance>
    type ValueAtomInstanceExports = ExportsOf<typeof signalInstance>
    type ValueAtomInstancePromise = PromiseOf<typeof signalInstance>
    type ValueAtomInstanceEvents = EventsOf<typeof signalInstance>

    type TSignalAtomInstance = NodeOf<typeof signalAtom>
    type TSignalAtomTemplate = TemplateOf<typeof signalInstance>
    type TValueAtomInstance = NodeOf<typeof valueAtom>
    type TValueAtomTemplate = TemplateOf<typeof valueInstance>

    expectTypeOf<SignalAtomState>().toBeString()
    expectTypeOf<SignalAtomState>().toEqualTypeOf<ValueAtomState>()
    expectTypeOf<SignalAtomInstanceState>().toBeString()
    expectTypeOf<SignalAtomInstanceState>().toEqualTypeOf<ValueAtomInstanceState>()

    expectTypeOf<SignalAtomParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<SignalAtomParams>().toEqualTypeOf<ValueAtomParams>()
    expectTypeOf<SignalAtomInstanceParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<SignalAtomInstanceParams>().toEqualTypeOf<ValueAtomInstanceParams>()

    expectTypeOf<SignalAtomExports>().toEqualTypeOf<Record<string, never>>()
    expectTypeOf<SignalAtomExports>().toEqualTypeOf<ValueAtomExports>()
    expectTypeOf<SignalAtomInstanceExports>().toEqualTypeOf<
      Record<string, never>
    >()
    expectTypeOf<SignalAtomInstanceExports>().toEqualTypeOf<ValueAtomInstanceExports>()

    expectTypeOf<SignalAtomPromise>().toBeUndefined()
    expectTypeOf<SignalAtomPromise>().toEqualTypeOf<ValueAtomPromise>()
    expectTypeOf<SignalAtomInstancePromise>().toBeUndefined()
    expectTypeOf<SignalAtomInstancePromise>().toEqualTypeOf<ValueAtomInstancePromise>()

    expectTypeOf<SignalAtomEvents>().toEqualTypeOf<Record<never, never>>()
    expectTypeOf<SignalAtomEvents>().toEqualTypeOf<ValueAtomEvents>()
    expectTypeOf<SignalAtomInstanceEvents>().toEqualTypeOf<
      Record<never, never>
    >()
    expectTypeOf<SignalAtomInstanceEvents>().toEqualTypeOf<ValueAtomInstanceEvents>()

    expectTypeOf<TSignalAtomInstance>().toEqualTypeOf<typeof signalInstance>()
    expectTypeOf<TSignalAtomTemplate>().toEqualTypeOf<typeof signalInstance.t>()
    expectTypeOf<TValueAtomInstance>().toEqualTypeOf<typeof signalInstance>()
    expectTypeOf<TValueAtomTemplate>().toEqualTypeOf<
      AtomTemplateRecursive<{
        State: ValueAtomState
        Params: ValueAtomParams
        Exports: ValueAtomExports
        Events: Record<never, never>
        Promise: ValueAtomPromise
      }>
    >()
  })

  test('atom api inference in atoms', () => {
    const signalAtom = atom('signal', (p: string) => {
      const signal = injectSignal(p)

      return api(signal)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const valueAtom = atom('value', (p: string) => {
      return api(p)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const queryAtom = atom('query', (p: string) => {
      return api(Promise.resolve(p)).setExports({
        toNum: (str: string) => Number(str),
      })
    })

    const queryWithPromiseAtom = atom('queryWithPromise', (p: string) => {
      return api(Promise.resolve(p))
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve(1))
    })

    const noExportsAtom = atom('noExports', () => api('a'))

    type ExpectedExports = {
      toNum: (str: string) => number
    }

    expectTypeOf<StateOf<typeof signalAtom>>().toBeString()
    expectTypeOf<StateOf<typeof valueAtom>>().toBeString()
    expectTypeOf<StateOf<typeof queryAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<StateOf<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<StateOf<typeof noExportsAtom>>().toBeString()

    expectTypeOf<ParamsOf<typeof signalAtom>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof valueAtom>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof queryAtom>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<ParamsOf<typeof noExportsAtom>>().toEqualTypeOf<[]>()

    expectTypeOf<
      ExportsOf<typeof signalAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<ExportsOf<typeof valueAtom>>().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<ExportsOf<typeof queryAtom>>().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      ExportsOf<typeof queryWithPromiseAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<ExportsOf<typeof noExportsAtom>>().toEqualTypeOf<
      Record<string, never>
    >()

    expectTypeOf<EventsOf<typeof signalAtom>>().toEqualTypeOf<
      Record<never, never>
    >()
    expectTypeOf<EventsOf<typeof valueAtom>>().toEqualTypeOf<
      Record<never, never>
    >()
    expectTypeOf<EventsOf<typeof queryAtom>>().toEqualTypeOf<None>()
    expectTypeOf<EventsOf<typeof queryWithPromiseAtom>>().toEqualTypeOf<None>()
    expectTypeOf<EventsOf<typeof noExportsAtom>>().toEqualTypeOf<None>()

    expectTypeOf<PromiseOf<typeof signalAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<PromiseOf<typeof valueAtom>>().toEqualTypeOf<Promise<string>>()
    expectTypeOf<PromiseOf<typeof queryAtom>>().toEqualTypeOf<Promise<string>>()
    expectTypeOf<PromiseOf<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<PromiseOf<typeof noExportsAtom>>().toEqualTypeOf<undefined>()
  })

  test('non-atom-api inference in ions', () => {
    const signalIon = ion('signal', (_, p: string) => injectSignal(p))
    const valueIon = ion('value', (_, p: string) => p)

    const signalInstance = ecosystem.getNode(signalIon, ['a'])
    const valueInstance = ecosystem.getNode(valueIon, ['a'])

    type SignalIonState = StateOf<typeof signalIon>
    type SignalIonParams = ParamsOf<typeof signalIon>
    type SignalIonExports = ExportsOf<typeof signalIon>
    type SignalIonPromise = PromiseOf<typeof signalIon>
    type SignalIonEvents = EventsOf<typeof signalIon>
    type ValueIonState = StateOf<typeof valueIon>
    type ValueIonParams = ParamsOf<typeof valueIon>
    type ValueIonExports = ExportsOf<typeof valueIon>
    type ValueIonPromise = PromiseOf<typeof valueIon>
    type ValueIonEvents = EventsOf<typeof valueIon>

    type SignalIonInstanceState = StateOf<typeof signalInstance>
    type SignalIonInstanceParams = ParamsOf<typeof signalInstance>
    type SignalIonInstanceExports = ExportsOf<typeof signalInstance>
    type SignalIonInstancePromise = PromiseOf<typeof signalInstance>
    type SignalIonInstanceEvents = EventsOf<typeof signalInstance>
    type ValueIonInstanceState = StateOf<typeof signalInstance>
    type ValueIonInstanceParams = ParamsOf<typeof signalInstance>
    type ValueIonInstanceExports = ExportsOf<typeof signalInstance>
    type ValueIonInstancePromise = PromiseOf<typeof signalInstance>
    type ValueIonInstanceEvents = EventsOf<typeof signalInstance>

    type TSignalIonInstance = NodeOf<typeof signalIon>
    type TSignalIonTemplate = TemplateOf<typeof signalInstance>
    type TValueIonInstance = NodeOf<typeof valueIon>
    type TValueIonTemplate = TemplateOf<typeof valueInstance>

    expectTypeOf<SignalIonState>().toBeString()
    expectTypeOf<SignalIonState>().toEqualTypeOf<ValueIonState>()
    expectTypeOf<SignalIonInstanceState>().toBeString()
    expectTypeOf<SignalIonInstanceState>().toEqualTypeOf<ValueIonInstanceState>()

    expectTypeOf<SignalIonParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<SignalIonParams>().toEqualTypeOf<ValueIonParams>()
    expectTypeOf<SignalIonInstanceParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<SignalIonInstanceParams>().toEqualTypeOf<ValueIonInstanceParams>()

    expectTypeOf<SignalIonExports>().toEqualTypeOf<Record<never, never>>()
    expectTypeOf<SignalIonExports>().toEqualTypeOf<ValueIonExports>()
    expectTypeOf<SignalIonInstanceExports>().toEqualTypeOf<
      Record<never, never>
    >()
    expectTypeOf<SignalIonInstanceExports>().toEqualTypeOf<ValueIonInstanceExports>()

    expectTypeOf<SignalIonPromise>().toBeUndefined()
    expectTypeOf<SignalIonPromise>().toEqualTypeOf<ValueIonPromise>()
    expectTypeOf<SignalIonInstancePromise>().toBeUndefined()
    expectTypeOf<SignalIonInstancePromise>().toEqualTypeOf<ValueIonInstancePromise>()

    expectTypeOf<SignalIonEvents>().toEqualTypeOf<None>()
    expectTypeOf<SignalIonEvents>().toEqualTypeOf<ValueIonEvents>()
    expectTypeOf<SignalIonInstanceEvents>().toEqualTypeOf<None>()
    expectTypeOf<SignalIonInstanceEvents>().toEqualTypeOf<ValueIonInstanceEvents>()

    expectTypeOf<TSignalIonInstance>().toEqualTypeOf<typeof signalInstance>()
    expectTypeOf<TSignalIonTemplate>().toEqualTypeOf<
      IonTemplateRecursive<{
        State: SignalIonState
        Params: SignalIonParams
        Exports: SignalIonExports
        Events: SignalIonEvents
        Promise: SignalIonPromise
      }>
    >()
    expectTypeOf<TValueIonInstance>().toEqualTypeOf<typeof signalInstance>()
    expectTypeOf<TValueIonTemplate>().toEqualTypeOf<
      IonTemplateRecursive<{
        State: SignalIonState
        Params: SignalIonParams
        Exports: SignalIonExports
        Events: SignalIonEvents
        Promise: SignalIonPromise
      }>
    >()
  })

  test('atom api inference in ions', () => {
    const signalIon = ion('signal', (_, p: string) => {
      const signal = injectSignal(p, {
        events: exampleEvents,
      })

      return api(signal)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const valueIon = ion('value', (_, p: string) => {
      return api(p)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const queryIon = ion('query', (_, p: string) => {
      return api(Promise.resolve(p)).setExports({
        toNum: (str: string) => Number(str),
      })
    })

    const queryWithPromiseIon = ion('queryWithPromise', (_, p: string) => {
      return api(Promise.resolve(p))
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve(1))
    })

    type ExpectedExports = {
      toNum: (str: string) => number
    }

    expectTypeOf<StateOf<typeof signalIon>>().toBeString()
    expectTypeOf<StateOf<typeof valueIon>>().toBeString()
    expectTypeOf<StateOf<typeof queryIon>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<StateOf<typeof queryWithPromiseIon>>().toEqualTypeOf<
      PromiseState<string>
    >()

    expectTypeOf<ParamsOf<typeof signalIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof valueIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof queryIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<ParamsOf<typeof queryWithPromiseIon>>().toEqualTypeOf<
      [p: string]
    >()

    expectTypeOf<ExportsOf<typeof signalIon>>().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<ExportsOf<typeof valueIon>>().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<ExportsOf<typeof queryIon>>().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      ExportsOf<typeof queryWithPromiseIon>
    >().toEqualTypeOf<ExpectedExports>()

    expectTypeOf<EventsOf<typeof signalIon>>().toEqualTypeOf<ExampleEvents>()
    expectTypeOf<EventsOf<typeof valueIon>>().toEqualTypeOf<None>()
    expectTypeOf<EventsOf<typeof queryIon>>().toEqualTypeOf<None>()
    expectTypeOf<EventsOf<typeof queryWithPromiseIon>>().toEqualTypeOf<None>()

    expectTypeOf<PromiseOf<typeof signalIon>>().toEqualTypeOf<Promise<string>>()
    expectTypeOf<PromiseOf<typeof valueIon>>().toEqualTypeOf<Promise<string>>()
    expectTypeOf<PromiseOf<typeof queryIon>>().toEqualTypeOf<Promise<string>>()
    expectTypeOf<PromiseOf<typeof queryWithPromiseIon>>().toEqualTypeOf<
      Promise<string>
    >()
  })

  test('AnyAtomGenerics - instances as params', () => {
    const innerAtom = atom('inner', 'a')

    const outerAtom = atom(
      'outer',
      (instance: AtomInstance<AnyAtomGenerics<{ State: string }>>) => {
        const val = injectAtomValue(instance) // subscribe to updates

        return val.toUpperCase()
      }
    )

    const innerInstance = ecosystem.getInstance(innerAtom)
    const outerInstance = ecosystem.getNode(outerAtom, [innerInstance])
    const val = outerInstance.get()

    expect(val).toBe('A')
    expectTypeOf<typeof innerInstance>().toMatchTypeOf<
      AtomInstanceRecursive<{
        Exports: Record<string, never>
        Params: []
        State: string
        Events: None
        Promise: undefined
      }>
    >()

    expectTypeOf<typeof outerInstance>().toMatchTypeOf<
      AtomInstanceRecursive<{
        Exports: Record<string, never>
        Params: [
          instance: AtomInstance<
            AnyAtomGenerics<{
              State: string
            }>
          >
        ]
        State: string
        Events: None
        Promise: undefined
      }>
    >()
  })

  test('accepting templates', () => {
    const allOptionalParamsAtom = atom(
      'allOptionalParams',
      (a?: boolean, b?: string[]) => {
        const signal = injectSignal(a ? b : 2)

        return signal
      }
    )

    const allRequiredParamsAtom = atom(
      'allRequiredParams',
      (a: string, b: number, c: boolean) => (c ? a : b)
    )

    const someOptionalParamsAtom = atom(
      'someOptionalParams',
      (a: string, b?: number) => a + b
    )

    const getKey = <A extends AnyAtomTemplate>(template: A) => template.key

    let idCounter = 0
    const instantiateWithId = <
      A extends AnyAtomTemplate<{ Params: [id: string] }>
    >(
      template: A
    ) =>
      ecosystem.getInstance(template, [(idCounter++).toString()] as ParamsOf<A>)

    const key = getKey(exampleAtom)
    const instance = instantiateWithId(exampleAtom)
    const instance2 = ecosystem.getInstance(allOptionalParamsAtom)

    // @ts-expect-error exampleAtom's param is required
    ecosystem.getInstance(exampleAtom)
    // @ts-expect-error exampleAtom's param should be a string
    ecosystem.getInstance(exampleAtom, [2])
    // @ts-expect-error exampleAtom only needs 1 param
    ecosystem.getInstance(exampleAtom, ['a', 2])
    ecosystem.getInstance(allOptionalParamsAtom, [undefined, undefined])
    ecosystem.getInstance(allOptionalParamsAtom, [undefined, ['1']])
    // @ts-expect-error allOptionalParamsAtom's 2nd param is type `string[]`
    ecosystem.getInstance(allOptionalParamsAtom, [undefined, [1]])

    expectTypeOf<typeof key>().toBeString()
    expectTypeOf<typeof instance>().toMatchTypeOf<
      AtomInstanceRecursive<{
        State: string
        Params: [p: string]
        Exports: {
          getBool: () => boolean
          getNum: () => number
        }
        Events: ExampleEvents
        Promise: Promise<number>
      }>
    >()
    expectTypeOf<typeof instance2>().toMatchTypeOf<
      AtomInstanceRecursive<{
        State: number | string[] | undefined
        Params: [a?: boolean | undefined, b?: string[] | undefined]
        Exports: Record<string, never>
        Events: None
        Promise: undefined
      }>
    >()

    // @ts-expect-error has a required param, so params must be passed
    ecosystem.getInstance(someOptionalParamsAtom)

    // @ts-expect-error all params required, so params must be passed
    ecosystem.get(allRequiredParamsAtom)

    function noParams<A extends AnyAtomTemplate<{ Params: [] }>>(atom: A) {
      return ecosystem.get(atom)
    }

    // @ts-expect-error optional params not allowed
    noParams(someOptionalParamsAtom)

    expectTypeOf(
      ecosystem.get(someOptionalParamsAtom, ['a'])
    ).toMatchTypeOf<string>()

    expectTypeOf(noParams(atom('no-params-test', null))).toMatchTypeOf<null>()
  })

  test('accepting instances', () => {
    const getExampleVal = <I extends NodeOf<typeof exampleAtom>>(i: I) =>
      i.get()

    const getKey = <I extends AnyAtomInstance>(instance: I) => instance.t.key

    const getUppercase = <I extends AnyAtomInstance<{ State: string }>>(
      instance: I
    ) => instance.get().toUpperCase()

    const getNum = <
      I extends Omit<AnyAtomInstance<{ State: string }>, 'exports'> & {
        exports: { getNum: () => number }
      }
    >(
      i: I
    ) => i.exports.getNum()

    const getNum2 = <I extends { exports: { getNum: () => number } }>(i: I) =>
      i.exports.getNum()

    const getValue: {
      // params ("family"):
      <A extends AnyAtomTemplate>(template: A, params: ParamsOf<A>): StateOf<A>

      // no params ("singleton"):
      <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): StateOf<A>

      // also accept instances:
      <I extends AnyAtomInstance>(instance: I): StateOf<I>
    } = <A extends AnyAtomTemplate | AnyAtomInstance>(
      template: A,
      params?: ParamsOf<A>
    ) => ecosystem.get(template as AnyAtomTemplate, params)

    const instance = ecosystem.getInstance(exampleAtom, ['a'])
    const exampleVal = getExampleVal(instance)
    const key = getKey(instance)
    const uppercase = getUppercase(instance)
    const num = getNum(instance)
    const num2 = getNum2(instance)
    const val = getValue(exampleAtom, ['a'])
    const val2 = getValue(instance)

    expectTypeOf<typeof exampleVal>().toBeString()
    expectTypeOf<typeof key>().toBeString()
    expectTypeOf<typeof uppercase>().toBeString()
    expectTypeOf<typeof num>().toBeNumber()
    expectTypeOf<typeof num2>().toBeNumber()
    expectTypeOf<typeof val>().toBeString()
    expectTypeOf<typeof val2>().toBeString()
  })

  test('injectors', () => {
    const injectingAtom = atom('injecting', () => {
      // @ts-expect-error missing param
      injectAtomInstance(exampleAtom)
      const instance = injectAtomInstance(exampleAtom, ['a'])
      const val1 = injectAtomValue(exampleAtom, ['a'])
      const val2 = injectAtomValue(instance)
      const [val3] = injectAtomState(exampleAtom, ['a'])
      const [val4] = injectAtomState(instance)
      const val5 = injectMemo(() => true, [])
      const val6 = injectCallback(() => true, [])
      const val7 = injectPromise(() => Promise.resolve(1), [])

      return api(injectSignal(instance.getOnce())).setExports({
        val1,
        val2,
        val3,
        val4,
        val5,
        val6,
        val7,
      })
    })

    const instance = ecosystem.getInstance(injectingAtom)

    expectTypeOf<StateOf<typeof instance>>().toBeString()
    expectTypeOf<ExportsOf<typeof instance>>().toMatchTypeOf<{
      val1: string
      val2: string
      val3: string
      val4: string
      val5: boolean
      val6: () => boolean
      val7: AtomApi<{
        Exports: Record<string, any>
        Promise: Promise<number>
        State: PromiseState<number>
        Signal: Signal<{ Events: None; State: PromiseState<number> }>
      }>
    }>()
  })

  test('AtomTuple', () => {
    const getPromise = <A extends AnyAtomTemplate<{ Promise: Promise<any> }>>(
      ...[template, params]: AtomTuple<A>
    ) => ecosystem.getInstance(template, params).promise as PromiseOf<A>

    const promise = getPromise(exampleAtom, ['a'])

    expectTypeOf<typeof promise>().resolves.toBeNumber()
  })

  test('AtomApi types helpers', () => {
    const signal = ecosystem.signal('a', {
      events: {
        eventA: () => 1,
        eventB: () => 2,
      },
    })

    const withEverything = api(signal)
      .addExports({ a: 1 })
      .setPromise(Promise.resolve(true))

    expectTypeOf<ExportsOf<typeof withEverything>>().toEqualTypeOf<{
      a: number
    }>()
    expectTypeOf<PromiseOf<typeof withEverything>>().toEqualTypeOf<
      Promise<boolean>
    >()
    expectTypeOf<StateOf<typeof withEverything>>().toBeString()
    expectTypeOf<EventsOf<typeof withEverything>>().toEqualTypeOf<{
      eventA: 1
      eventB: 2
    }>()
  })

  test('promises', () => {
    const atom1 = atom('1', () => api().setPromise())
    const atom2 = atom('1', () => api().setPromise(undefined))
    const atom3 = atom('1', () =>
      api().setPromise().setPromise(Promise.resolve(2))
    )

    expectTypeOf<PromiseOf<typeof atom1>>().toBeUndefined()
    expectTypeOf<PromiseOf<typeof atom2>>().toBeUndefined()
    expectTypeOf<PromiseOf<typeof atom3>>().resolves.toBeNumber()
  })

  test('recursive templates and nodes', () => {
    const instanceA = exampleAtom._createInstance(ecosystem, 'a', ['b'])
    const instanceB = instanceA.t._createInstance(ecosystem, '', ['b'])
    const instanceC = instanceB.t._createInstance(ecosystem, '', ['b'])
    const instanceD = instanceC.t._createInstance(ecosystem, '', ['b'])

    expectTypeOf<ParamsOf<typeof instanceD.t>>().toEqualTypeOf<[p: string]>()

    const instanceE = ecosystem.getInstance(
      ecosystem.live.getInstance(
        ecosystem.getInstance(ecosystem.live.getInstance(exampleAtom, ['a']))
      )
    )

    expectTypeOf<ParamsOf<typeof instanceE.t>>().toEqualTypeOf<[p: string]>()

    const selectorInstance = ecosystem.getNode(
      ecosystem.getNode(
        ecosystem.getNode((_: AtomGetters, a?: string) => a, ['a'])
      )
    )

    expectTypeOf<StateOf<typeof selectorInstance>>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<ParamsOf<typeof selectorInstance>>().toEqualTypeOf<
      [a?: string]
    >()
    expectTypeOf<TemplateOf<typeof selectorInstance>>().toEqualTypeOf<
      (_: AtomGetters, a?: string) => string | undefined
    >()

    const selectorInstance2 = ecosystem.getNode(
      ecosystem.getNode(
        ecosystem.getNode(
          {
            resultsComparator: () => true,
            selector: (_: AtomGetters, a?: string) => a,
            argsComparator: () => true,
          },
          ['a']
        )
      )
    )

    expectTypeOf<StateOf<typeof selectorInstance2>>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<ParamsOf<typeof selectorInstance2>>().toEqualTypeOf<
      [a?: string]
    >()
    expectTypeOf<TemplateOf<typeof selectorInstance2>>().toEqualTypeOf<{
      resultsComparator: () => boolean
      selector: (_: AtomGetters, a?: string) => string | undefined
      argsComparator: () => boolean
    }>()
  })

  test('signals', () => {
    const signal = ecosystem.signal(1, {
      events: {
        a: As<number>,
        b: As<undefined>,
      },
    })

    type Generics = {
      Events: EventsOf<typeof signal>
      State: StateOf<typeof signal>
      Params: undefined
      Template: undefined
    }

    type TestListenableEvents = Partial<{
      a: number
      b: undefined
      mutate: Transaction[]
      change: ChangeEvent<Generics>
      cycle: CycleEvent<Generics>
      invalidate: InvalidateEvent<Generics>
      promiseChange: PromiseChangeEvent<Generics>
    }>

    const calls: any[] = []

    signal.on('a', (payload, eventMap) => {
      expectTypeOf(payload).toEqualTypeOf<number>()
      expectTypeOf(eventMap).toEqualTypeOf<TestListenableEvents>()
      calls.push(['a', payload, eventMap])
    })

    signal.on('change', ({ newState, oldState }, eventMap) => {
      expectTypeOf(newState).toEqualTypeOf<number>()
      expectTypeOf(oldState).toEqualTypeOf<number>()
      expectTypeOf(eventMap).toEqualTypeOf<TestListenableEvents>()
      calls.push(['change', { newState, oldState }, eventMap])
    })

    signal.on(eventMap => {
      expectTypeOf(eventMap).toEqualTypeOf<TestListenableEvents>()
      calls.push(['*', eventMap])
    })

    snapshotNodes()

    signal.set(state => state + 1, { a: 11 })

    const expectedChangeEvent = {
      newState: 2,
      oldState: 1,
      operation: undefined,
      reasons: [],
      source: signal,
      type: 'change',
    }

    expect(calls).toEqual([
      ['a', 11, { a: 11, change: expectedChangeEvent }],
      [
        'change',
        { newState: 2, oldState: 1 },
        { a: 11, change: expectedChangeEvent },
      ],
      ['*', { a: 11, change: expectedChangeEvent }],
    ])
    calls.splice(0, 3)

    signal.send('a', 11)

    expect(calls).toEqual([
      ['a', 11, { a: 11 }],
      ['*', { a: 11 }],
    ])
    calls.splice(0, 2)

    signal.send('b')

    expect(calls).toEqual([['*', { b: undefined }]])
    calls.splice(0, 1)

    signal.send({
      a: 12,
      b: undefined,
    })

    expect(calls).toEqual([
      ['a', 12, { a: 12, b: undefined }],
      ['*', { a: 12, b: undefined }],
    ])
    calls.splice(0, 2)

    type SignalEvents = EventsOf<typeof signal>
    type SignalState = StateOf<typeof signal>

    expectTypeOf<SignalEvents>().toEqualTypeOf<{ a: number; b: undefined }>()
    expectTypeOf<SignalState>().toEqualTypeOf<number>()

    expect(ecosystem.get(signal)).toBe(2)
  })
})
