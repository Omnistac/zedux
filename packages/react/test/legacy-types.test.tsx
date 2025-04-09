import { Store, StoreStateType, createStore } from '@zedux/core'
import {
  AnyAtomTemplate,
  AtomGetters,
  AtomTuple,
  createEcosystem,
  Ecosystem,
  injectAtomInstance,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectMemo,
  injectSelf,
  None,
  ParamlessTemplate,
  PromiseState,
} from '@zedux/react'
import {
  AnyStoreAtomInstance,
  AnyStoreAtomTemplate,
  AnyStoreAtomGenerics,
  storeApi,
  storeAtom,
  StoreAtomApi,
  AtomExportsType,
  StoreAtomInstance,
  StoreAtomInstanceRecursive,
  AtomInstanceType,
  AtomParamsType,
  AtomPromiseType,
  AtomStateType,
  AtomStoreType,
  StoreAtomTemplateRecursive,
  AtomTemplateType,
  injectStorePromise,
  injectStore,
  storeIon,
  StoreIonTemplateRecursive,
} from '@zedux/stores'
import { expectTypeOf } from 'expect-type'

const exampleAtom = storeAtom('example', (p: string) => {
  const store = injectStore(p)

  const partialInstance = injectSelf()

  if ((partialInstance as AtomInstanceType<typeof exampleAtom>).store) {
    ;(partialInstance as AtomInstanceType<typeof exampleAtom>).store.getState()
  }

  return storeApi(store)
    .setExports({
      getBool: () => Boolean(store.getState()),
      getNum: () => Number(store.getState()),
    })
    .setPromise(Promise.resolve(2))
})

const ecosystem = createEcosystem({ id: 'root' })

afterEach(() => {
  ecosystem.reset()
})

describe('react types', () => {
  test('atom generic getters', () => {
    const instance = ecosystem.getInstance(exampleAtom, ['a'])

    type AtomState = AtomStateType<typeof exampleAtom>
    type AtomParams = AtomParamsType<typeof exampleAtom>
    type AtomExports = AtomExportsType<typeof exampleAtom>
    type AtomPromise = AtomPromiseType<typeof exampleAtom>
    type AtomStore = AtomStoreType<typeof exampleAtom>

    type AtomInstanceState = AtomStateType<typeof instance>
    type AtomInstanceParams = AtomParamsType<typeof instance>
    type AtomInstanceExports = AtomExportsType<typeof instance>
    type AtomInstancePromise = AtomPromiseType<typeof instance>
    type AtomInstanceStore = AtomStoreType<typeof instance>

    type TAtomInstance = AtomInstanceType<typeof exampleAtom>
    type TAtomTemplate = AtomTemplateType<typeof instance>

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

    expectTypeOf<AtomStore>().toEqualTypeOf<Store<string>>()
    expectTypeOf<AtomStore>().toEqualTypeOf<AtomInstanceStore>()

    expectTypeOf<TAtomInstance>().toEqualTypeOf<typeof instance>()
    expectTypeOf<TAtomTemplate>().toEqualTypeOf<typeof instance.t>()

    expectTypeOf<StoreStateType<AtomStore>>().toBeString()
  })

  test('non-atom-api inference in atoms', () => {
    const storeBasedAtom = storeAtom('store', (p: string) => injectStore(p))
    const valueAtom = storeAtom('value', (p: string) => p)

    const storeInstance = ecosystem.getInstance(storeBasedAtom, ['a'])
    const valueInstance = ecosystem.getInstance(valueAtom, ['a'])

    type StoreAtomState = AtomStateType<typeof storeBasedAtom>
    type StoreAtomParams = AtomParamsType<typeof storeBasedAtom>
    type StoreAtomExports = AtomExportsType<typeof storeBasedAtom>
    type StoreAtomPromise = AtomPromiseType<typeof storeBasedAtom>
    type StoreAtomStore = AtomStoreType<typeof storeBasedAtom>
    type ValueAtomState = AtomStateType<typeof valueAtom>
    type ValueAtomParams = AtomParamsType<typeof valueAtom>
    type ValueAtomExports = AtomExportsType<typeof valueAtom>
    type ValueAtomPromise = AtomPromiseType<typeof valueAtom>
    type ValueAtomStore = AtomStoreType<typeof valueAtom>

    type StoreAtomInstanceState = AtomStateType<typeof storeInstance>
    type StoreAtomInstanceParams = AtomParamsType<typeof storeInstance>
    type StoreAtomInstanceExports = AtomExportsType<typeof storeInstance>
    type StoreAtomInstancePromise = AtomPromiseType<typeof storeInstance>
    type StoreAtomInstanceStore = AtomStoreType<typeof storeInstance>
    type ValueAtomInstanceState = AtomStateType<typeof storeInstance>
    type ValueAtomInstanceParams = AtomParamsType<typeof storeInstance>
    type ValueAtomInstanceExports = AtomExportsType<typeof storeInstance>
    type ValueAtomInstancePromise = AtomPromiseType<typeof storeInstance>
    type ValueAtomInstanceStore = AtomStoreType<typeof storeInstance>

    type TStoreAtomInstance = AtomInstanceType<typeof storeBasedAtom>
    type TStoreAtomTemplate = AtomTemplateType<typeof storeInstance>
    type TValueAtomInstance = AtomInstanceType<typeof valueAtom>
    type TValueAtomTemplate = AtomTemplateType<typeof valueInstance>

    expectTypeOf<StoreAtomState>().toBeString()
    expectTypeOf<StoreAtomState>().toEqualTypeOf<ValueAtomState>()
    expectTypeOf<StoreAtomInstanceState>().toBeString()
    expectTypeOf<StoreAtomInstanceState>().toEqualTypeOf<ValueAtomInstanceState>()

    expectTypeOf<StoreAtomParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<StoreAtomParams>().toEqualTypeOf<ValueAtomParams>()
    expectTypeOf<StoreAtomInstanceParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<StoreAtomInstanceParams>().toEqualTypeOf<ValueAtomInstanceParams>()

    expectTypeOf<StoreAtomExports>().toEqualTypeOf<None>()
    expectTypeOf<StoreAtomExports>().toEqualTypeOf<ValueAtomExports>()
    expectTypeOf<StoreAtomInstanceExports>().toEqualTypeOf<None>()
    expectTypeOf<StoreAtomInstanceExports>().toEqualTypeOf<ValueAtomInstanceExports>()

    expectTypeOf<StoreAtomPromise>().toBeUndefined()
    expectTypeOf<StoreAtomPromise>().toEqualTypeOf<ValueAtomPromise>()
    expectTypeOf<StoreAtomInstancePromise>().toBeUndefined()
    expectTypeOf<StoreAtomInstancePromise>().toEqualTypeOf<ValueAtomInstancePromise>()

    expectTypeOf<StoreAtomStore>().toEqualTypeOf<Store<string>>()
    expectTypeOf<StoreAtomStore>().toEqualTypeOf<ValueAtomStore>()
    expectTypeOf<StoreAtomInstanceStore>().toEqualTypeOf<Store<string>>()
    expectTypeOf<StoreAtomInstanceStore>().toEqualTypeOf<ValueAtomInstanceStore>()

    expectTypeOf<TStoreAtomInstance>().toEqualTypeOf<typeof storeInstance>()
    expectTypeOf<TStoreAtomTemplate>().toEqualTypeOf<typeof storeInstance.t>()
    expectTypeOf<TValueAtomInstance>().toEqualTypeOf<
      StoreAtomInstance<
        {
          Events: None
          Exports: None
          Params: [p: string]
          Promise: undefined
          State: string
          Store: Store<string>
        } & {
          Node: StoreAtomInstanceRecursive<{
            Events: None
            Exports: None
            Params: [p: string]
            Promise: undefined
            State: string
            Store: Store<string>
          }>
          Template: StoreAtomTemplateRecursive<{
            Events: None
            Exports: None
            Params: [p: string]
            Promise: undefined
            State: string
            Store: Store<string>
          }>
        }
      >
    >()
    expectTypeOf<TValueAtomTemplate>().toEqualTypeOf<
      StoreAtomTemplateRecursive<{
        State: ValueAtomState
        Params: ValueAtomParams
        Events: None
        Exports: ValueAtomExports
        Store: ValueAtomStore
        Promise: ValueAtomPromise
      }>
    >()
  })

  test('atom api inference in atoms', () => {
    const storeBasedAtom = storeAtom('store', (p: string) => {
      const store = injectStore(p)

      return storeApi(store)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const valueAtom = storeAtom('value', (p: string) => {
      return storeApi(p)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const queryAtom = storeAtom('query', (p: string) => {
      return storeApi(Promise.resolve(p)).setExports({
        toNum: (str: string) => Number(str),
      })
    })

    const queryWithPromiseAtom = storeAtom('queryWithPromise', (p: string) => {
      return storeApi(Promise.resolve(p))
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve(1))
    })

    const noExportsAtom = storeAtom('noExports', () => storeApi('a'))

    type ExpectedExports = {
      toNum: (str: string) => number
    }

    expectTypeOf<AtomStateType<typeof storeBasedAtom>>().toBeString()
    expectTypeOf<AtomStateType<typeof valueAtom>>().toBeString()
    expectTypeOf<AtomStateType<typeof queryAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof noExportsAtom>>().toBeString()

    expectTypeOf<AtomParamsType<typeof storeBasedAtom>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<AtomParamsType<typeof valueAtom>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<AtomParamsType<typeof queryAtom>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<AtomParamsType<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<AtomParamsType<typeof noExportsAtom>>().toEqualTypeOf<[]>()

    expectTypeOf<
      AtomExportsType<typeof storeBasedAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof valueAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof queryAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof queryWithPromiseAtom>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<AtomExportsType<typeof noExportsAtom>>().toEqualTypeOf<
      Record<never, never>
    >()

    expectTypeOf<AtomStoreType<typeof storeBasedAtom>>().toEqualTypeOf<
      Store<string>
    >()
    expectTypeOf<AtomStoreType<typeof valueAtom>>().toEqualTypeOf<
      Store<string>
    >()
    expectTypeOf<AtomStoreType<typeof queryAtom>>().toEqualTypeOf<
      Store<PromiseState<string>>
    >()
    expectTypeOf<AtomStoreType<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      Store<PromiseState<string>>
    >()
    expectTypeOf<AtomStoreType<typeof noExportsAtom>>().toEqualTypeOf<
      Store<string>
    >()

    expectTypeOf<AtomPromiseType<typeof storeBasedAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof valueAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof queryAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<
      AtomPromiseType<typeof noExportsAtom>
    >().toEqualTypeOf<undefined>()
  })

  test('non-atom-api inference in ions', () => {
    const storeBasedIon = storeIon('store', (_, p: string) => injectStore(p))
    const valueIon = storeIon('value', (_, p: string) => p)

    const storeInstance = ecosystem.getNode(storeBasedIon, ['a'])
    const valueInstance = ecosystem.getNode(valueIon, ['a'])

    type StoreIonState = AtomStateType<typeof storeBasedIon>
    type StoreIonParams = AtomParamsType<typeof storeBasedIon>
    type StoreIonExports = AtomExportsType<typeof storeBasedIon>
    type StoreIonPromise = AtomPromiseType<typeof storeBasedIon>
    type StoreIonStore = AtomStoreType<typeof storeBasedIon>
    type ValueIonState = AtomStateType<typeof valueIon>
    type ValueIonParams = AtomParamsType<typeof valueIon>
    type ValueIonExports = AtomExportsType<typeof valueIon>
    type ValueIonPromise = AtomPromiseType<typeof valueIon>
    type ValueIonStore = AtomStoreType<typeof valueIon>

    type StoreIonInstanceState = AtomStateType<typeof storeInstance>
    type StoreIonInstanceParams = AtomParamsType<typeof storeInstance>
    type StoreIonInstanceExports = AtomExportsType<typeof storeInstance>
    type StoreIonInstancePromise = AtomPromiseType<typeof storeInstance>
    type StoreIonInstanceStore = AtomStoreType<typeof storeInstance>
    type ValueIonInstanceState = AtomStateType<typeof storeInstance>
    type ValueIonInstanceParams = AtomParamsType<typeof storeInstance>
    type ValueIonInstanceExports = AtomExportsType<typeof storeInstance>
    type ValueIonInstancePromise = AtomPromiseType<typeof storeInstance>
    type ValueIonInstanceStore = AtomStoreType<typeof storeInstance>

    type TStoreIonInstance = AtomInstanceType<typeof storeBasedIon>
    type TStoreIonTemplate = AtomTemplateType<typeof storeInstance>
    type TValueIonInstance = AtomInstanceType<typeof valueIon>
    type TValueIonTemplate = AtomTemplateType<typeof valueInstance>

    expectTypeOf<StoreIonState>().toBeString()
    expectTypeOf<StoreIonState>().toEqualTypeOf<ValueIonState>()
    expectTypeOf<StoreIonInstanceState>().toBeString()
    expectTypeOf<StoreIonInstanceState>().toEqualTypeOf<ValueIonInstanceState>()

    expectTypeOf<StoreIonParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<StoreIonParams>().toEqualTypeOf<ValueIonParams>()
    expectTypeOf<StoreIonInstanceParams>().toEqualTypeOf<[p: string]>()
    expectTypeOf<StoreIonInstanceParams>().toEqualTypeOf<ValueIonInstanceParams>()

    expectTypeOf<StoreIonExports>().toEqualTypeOf<None>()
    expectTypeOf<StoreIonExports>().toEqualTypeOf<ValueIonExports>()
    expectTypeOf<StoreIonInstanceExports>().toEqualTypeOf<None>()
    expectTypeOf<StoreIonInstanceExports>().toEqualTypeOf<ValueIonInstanceExports>()

    expectTypeOf<StoreIonPromise>().toBeUndefined()
    expectTypeOf<StoreIonPromise>().toEqualTypeOf<ValueIonPromise>()
    expectTypeOf<StoreIonInstancePromise>().toBeUndefined()
    expectTypeOf<StoreIonInstancePromise>().toEqualTypeOf<ValueIonInstancePromise>()

    expectTypeOf<StoreIonStore>().toEqualTypeOf<Store<string>>()
    expectTypeOf<StoreIonStore>().toEqualTypeOf<ValueIonStore>()
    expectTypeOf<StoreIonInstanceStore>().toEqualTypeOf<Store<string>>()
    expectTypeOf<StoreIonInstanceStore>().toEqualTypeOf<ValueIonInstanceStore>()

    expectTypeOf<TStoreIonInstance>().toEqualTypeOf<typeof storeInstance>()
    expectTypeOf<TStoreIonTemplate>().toEqualTypeOf<
      StoreIonTemplateRecursive<{
        State: StoreIonState
        Params: StoreIonParams
        Events: None
        Exports: StoreIonExports
        Store: StoreIonStore
        Promise: StoreIonPromise
      }>
    >()
    expectTypeOf<TValueIonInstance>().toEqualTypeOf<typeof storeInstance>()
    expectTypeOf<TValueIonTemplate>().toEqualTypeOf<
      StoreIonTemplateRecursive<{
        State: StoreIonState
        Params: StoreIonParams
        Events: None
        Exports: StoreIonExports
        Store: StoreIonStore
        Promise: StoreIonPromise
      }>
    >()
  })

  test('atom api inference in ions', () => {
    const storeBasedIon = storeIon('store', (_, p: string) => {
      const store = injectStore(p)

      return storeApi(store)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const valueIon = storeIon('value', (_, p: string) => {
      return storeApi(p)
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve('b'))
    })

    const queryIon = storeIon('query', (_, p: string) => {
      return storeApi(Promise.resolve(p)).setExports({
        toNum: (str: string) => Number(str),
      })
    })

    const queryWithPromiseIon = storeIon('queryWithPromise', (_, p: string) => {
      return storeApi(Promise.resolve(p))
        .setExports({ toNum: (str: string) => Number(str) })
        .setPromise(Promise.resolve(1))
    })

    type ExpectedExports = {
      toNum: (str: string) => number
    }

    expectTypeOf<AtomStateType<typeof storeBasedIon>>().toBeString()
    expectTypeOf<AtomStateType<typeof valueIon>>().toBeString()
    expectTypeOf<AtomStateType<typeof queryIon>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      PromiseState<string>
    >()

    expectTypeOf<AtomParamsType<typeof storeBasedIon>>().toEqualTypeOf<
      [p: string]
    >()
    expectTypeOf<AtomParamsType<typeof valueIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParamsType<typeof queryIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParamsType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      [p: string]
    >()

    expectTypeOf<
      AtomExportsType<typeof storeBasedIon>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof valueIon>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof queryIon>
    >().toEqualTypeOf<ExpectedExports>()
    expectTypeOf<
      AtomExportsType<typeof queryWithPromiseIon>
    >().toEqualTypeOf<ExpectedExports>()

    expectTypeOf<AtomStoreType<typeof storeBasedIon>>().toEqualTypeOf<
      Store<string>
    >()
    expectTypeOf<AtomStoreType<typeof valueIon>>().toEqualTypeOf<
      Store<string>
    >()
    expectTypeOf<AtomStoreType<typeof queryIon>>().toEqualTypeOf<
      Store<PromiseState<string>>
    >()
    expectTypeOf<AtomStoreType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      Store<PromiseState<string>>
    >()

    expectTypeOf<AtomPromiseType<typeof storeBasedIon>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof valueIon>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof queryIon>>().toEqualTypeOf<
      Promise<string>
    >()
    expectTypeOf<AtomPromiseType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      Promise<string>
    >()
  })

  test('AnyAtomGenerics - instances as params', () => {
    const innerAtom = storeAtom('inner', 'a')

    const outerAtom = storeAtom(
      'outer',
      (
        instance: StoreAtomInstance<AnyStoreAtomGenerics<{ State: string }>>
      ) => {
        const val = injectAtomValue(instance) // subscribe to updates

        return val.toUpperCase()
      }
    )

    const innerInstance = ecosystem.getInstance(innerAtom)
    const outerInstance = ecosystem.getNode(outerAtom, [innerInstance])
    const val = outerInstance.get()

    expect(val).toBe('A')
    expectTypeOf<typeof innerInstance>().toMatchTypeOf<
      StoreAtomInstanceRecursive<{
        Events: None
        Exports: None
        Params: []
        State: string
        Store: Store<string>
        Promise: undefined
      }>
    >()

    expectTypeOf<typeof outerInstance>().toMatchTypeOf<
      StoreAtomInstanceRecursive<{
        Events: None
        Exports: None
        Params: [
          instance: StoreAtomInstance<
            AnyStoreAtomGenerics<{
              State: string
            }>
          >
        ]
        State: string
        Store: Store<string>
        Promise: undefined
      }>
    >()
  })

  test('accepting templates', () => {
    const allOptionalParamsAtom = storeAtom(
      'allOptionalParams',
      (a?: boolean, b?: string[]) => {
        const store = injectStore(a ? b : 2)

        return store
      }
    )

    const allRequiredParamsAtom = storeAtom(
      'allRequiredParams',
      (a: string, b: number, c: boolean) => (c ? a : b)
    )

    const someOptionalParamsAtom = storeAtom(
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
      ecosystem.getInstance(template, [
        (idCounter++).toString(),
      ] as AtomParamsType<A>)

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
      StoreAtomInstanceRecursive<{
        State: string
        Params: [p: string]
        Events: None
        Exports: {
          getBool: () => boolean
          getNum: () => number
        }
        Store: Store<string>
        Promise: Promise<number>
      }>
    >()
    expectTypeOf<typeof instance2>().toMatchTypeOf<
      StoreAtomInstanceRecursive<{
        State: number | string[] | undefined
        Params: [a?: boolean | undefined, b?: string[] | undefined]
        Events: None
        Exports: None
        ResolvedState: number | string[] | undefined
        Store: Store<number | string[] | undefined>
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

    expectTypeOf(
      noParams(storeAtom('no-params-test', null))
    ).toMatchTypeOf<null>()
  })

  test('accepting instances', () => {
    const getExampleVal = <I extends AtomInstanceType<typeof exampleAtom>>(
      i: I
    ) => i.getState()

    const getKey = <I extends AnyStoreAtomInstance>(instance: I) =>
      instance.t.key

    const getUppercase = <I extends AnyStoreAtomInstance<{ State: string }>>(
      instance: I
    ) => instance.getState().toUpperCase()

    const getNum = <
      I extends Omit<AnyStoreAtomInstance<{ State: string }>, 'exports'> & {
        exports: { getNum: () => number }
      }
    >(
      i: I
    ) => i.exports.getNum()

    const getNum2 = <I extends { exports: { getNum: () => number } }>(i: I) =>
      i.exports.getNum()

    const getValue: {
      // params ("family"):
      <A extends AnyStoreAtomTemplate>(
        template: A,
        params: AtomParamsType<A>
      ): AtomStateType<A>

      // no params ("singleton"):
      <A extends AnyStoreAtomTemplate>(
        template: ParamlessTemplate<A>
      ): AtomStateType<A>

      // also accept instances:
      <I extends AnyStoreAtomInstance>(instance: I): AtomStateType<I>
    } = <A extends AnyStoreAtomTemplate | AnyStoreAtomInstance>(
      template: A,
      params?: AtomParamsType<A>
    ) => ecosystem.get(template as AnyStoreAtomTemplate, params)

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
    const injectingAtom = storeAtom('injecting', () => {
      // @ts-expect-error missing param
      injectAtomInstance(exampleAtom)
      const instance = injectAtomInstance(exampleAtom, ['a'])
      const val1 = injectAtomValue(exampleAtom, ['a'])
      const val2 = injectAtomValue(instance)
      const [val3] = injectAtomState(exampleAtom, ['a'])
      const [val4] = injectAtomState(instance)
      const val5 = injectMemo(() => true, [])
      const val6 = injectCallback(() => true, [])
      const val7 = injectStorePromise(() => Promise.resolve(1), [])

      return storeApi(injectStore(instance.getState())).setExports({
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

    expectTypeOf<AtomStateType<typeof instance>>().toBeString()
    expectTypeOf<AtomExportsType<typeof instance>>().toMatchTypeOf<{
      val1: string
      val2: string
      val3: string
      val4: string
      val5: boolean
      val6: () => boolean
      val7: StoreAtomApi<{
        Exports: Record<string, any>
        Promise: Promise<number>
        State: PromiseState<number>
        Store: Store<PromiseState<number>>
      }>
    }>()
  })

  test('AtomTuple', () => {
    const getPromise = <A extends AnyAtomTemplate<{ Promise: Promise<any> }>>(
      ...[template, params]: AtomTuple<A>
    ) => ecosystem.getInstance(template, params).promise as AtomPromiseType<A>

    const promise = getPromise(exampleAtom, ['a'])

    expectTypeOf<typeof promise>().resolves.toBeNumber()
  })

  test('AtomApi types helpers', () => {
    const store = createStore(null, 'a')
    const withEverything = storeApi(store)
      .addExports({ a: 1 })
      .setPromise(Promise.resolve(true))

    expectTypeOf<AtomExportsType<typeof withEverything>>().toEqualTypeOf<{
      a: number
    }>()
    expectTypeOf<AtomPromiseType<typeof withEverything>>().toEqualTypeOf<
      Promise<boolean>
    >()
    expectTypeOf<AtomStateType<typeof withEverything>>().toBeString()
    expectTypeOf<AtomStoreType<typeof withEverything>>().toEqualTypeOf<
      Store<string>
    >()
  })

  test('promises', () => {
    const atom1 = storeAtom('1', () => storeApi().setPromise())
    const atom2 = storeAtom('1', () => storeApi().setPromise(undefined))
    const atom3 = storeAtom('1', () =>
      storeApi().setPromise().setPromise(Promise.resolve(2))
    )

    expectTypeOf<AtomPromiseType<typeof atom1>>().toBeUndefined()
    expectTypeOf<AtomPromiseType<typeof atom2>>().toBeUndefined()
    expectTypeOf<AtomPromiseType<typeof atom3>>().resolves.toBeNumber()
  })

  test('recursive templates and nodes', () => {
    const instanceA = exampleAtom._instantiate(ecosystem, 'a', ['b'])
    const instanceB = instanceA.t._instantiate(ecosystem, '', ['b'])
    const instanceC = instanceB.t._instantiate(ecosystem, '', ['b'])
    const instanceD = instanceC.t._instantiate(ecosystem, '', ['b'])

    expectTypeOf<AtomParamsType<typeof instanceD.t>>().toEqualTypeOf<
      [p: string]
    >()

    const instanceE = ecosystem.getInstance(
      ecosystem.getInstance(
        ecosystem.getInstance(ecosystem.getInstance(exampleAtom, ['a']))
      )
    )

    expectTypeOf<AtomParamsType<typeof instanceE.t>>().toEqualTypeOf<
      [p: string]
    >()

    const selectorInstance = ecosystem.getNode(
      ecosystem.getNode(
        ecosystem.getNode((_: Ecosystem, a?: string) => a, ['a'])
      )
    )

    expectTypeOf<AtomStateType<typeof selectorInstance>>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<AtomParamsType<typeof selectorInstance>>().toEqualTypeOf<
      [a?: string]
    >()
    expectTypeOf<AtomTemplateType<typeof selectorInstance>>().toEqualTypeOf<
      (_: Ecosystem, a?: string) => string | undefined
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

    expectTypeOf<AtomStateType<typeof selectorInstance2>>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<AtomParamsType<typeof selectorInstance2>>().toEqualTypeOf<
      [a?: string]
    >()
    expectTypeOf<AtomTemplateType<typeof selectorInstance2>>().toEqualTypeOf<{
      resultsComparator: () => boolean
      selector: (_: AtomGetters, a?: string) => string | undefined
      argsComparator: () => boolean
    }>()
  })
})
