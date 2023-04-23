import { Store, StoreStateType, createStore } from '@zedux/core'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  api,
  atom,
  AtomApi,
  AtomExportsType,
  AtomGenericsPartial,
  AtomInstance,
  AtomInstanceType,
  AtomParamsType,
  AtomPromiseType,
  AtomStateType,
  AtomStoreType,
  AtomTemplateBase,
  AtomTemplateType,
  AtomTuple,
  createEcosystem,
  injectAtomInstance,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectMemo,
  injectPromise,
  injectSelf,
  injectStore,
  ion,
  ParamlessTemplate,
  PromiseState,
} from '@zedux/react'
import { expectTypeOf } from 'expect-type'

const exampleAtom = atom('example', (p: string) => {
  const store = injectStore(p)

  const partialInstance = injectSelf()

  if ((partialInstance as AtomInstanceType<typeof exampleAtom>).store) {
    ;(partialInstance as AtomInstanceType<typeof exampleAtom>).store.getState()
  }

  return api(store)
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

describe('types', () => {
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
    expectTypeOf<TAtomTemplate>().toEqualTypeOf<
      AtomTemplateBase<
        {
          State: AtomState
          Params: AtomParams
          Exports: AtomExports
          Store: AtomStore
          Promise: AtomPromise
        },
        TAtomInstance
      >
    >()

    expectTypeOf<StoreStateType<AtomStore>>().toBeString()
  })

  test('non-atom-api inference in atoms', () => {
    const storeAtom = atom('store', (p: string) => injectStore(p))
    const valueAtom = atom('value', (p: string) => p)

    const storeInstance = ecosystem.getInstance(storeAtom, ['a'])
    const valueInstance = ecosystem.getInstance(valueAtom, ['a'])

    type StoreAtomState = AtomStateType<typeof storeAtom>
    type StoreAtomParams = AtomParamsType<typeof storeAtom>
    type StoreAtomExports = AtomExportsType<typeof storeAtom>
    type StoreAtomPromise = AtomPromiseType<typeof storeAtom>
    type StoreAtomStore = AtomStoreType<typeof storeAtom>
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

    type TStoreAtomInstance = AtomInstanceType<typeof storeAtom>
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

    expectTypeOf<StoreAtomExports>().toEqualTypeOf<Record<string, never>>()
    expectTypeOf<StoreAtomExports>().toEqualTypeOf<ValueAtomExports>()
    expectTypeOf<StoreAtomInstanceExports>().toEqualTypeOf<
      Record<string, never>
    >()
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
    expectTypeOf<TStoreAtomTemplate>().toEqualTypeOf<
      AtomTemplateBase<
        {
          State: StoreAtomState
          Params: StoreAtomParams
          Exports: StoreAtomExports
          Store: StoreAtomStore
          Promise: StoreAtomPromise
        },
        TStoreAtomInstance
      >
    >()
    expectTypeOf<TValueAtomInstance>().toEqualTypeOf<typeof storeInstance>()
    expectTypeOf<TValueAtomTemplate>().toEqualTypeOf<
      AtomTemplateBase<
        {
          State: ValueAtomState
          Params: ValueAtomParams
          Exports: ValueAtomExports
          Store: ValueAtomStore
          Promise: ValueAtomPromise
        },
        TValueAtomInstance
      >
    >()
  })

  test('atom api inference in atoms', () => {
    const storeAtom = atom('store', (p: string) => {
      const store = injectStore(p)

      return api(store)
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

    expectTypeOf<AtomStateType<typeof storeAtom>>().toBeString()
    expectTypeOf<AtomStateType<typeof valueAtom>>().toBeString()
    expectTypeOf<AtomStateType<typeof queryAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof queryWithPromiseAtom>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof noExportsAtom>>().toBeString()

    expectTypeOf<AtomParamsType<typeof storeAtom>>().toEqualTypeOf<
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
      AtomExportsType<typeof storeAtom>
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
      Record<string, never>
    >()

    expectTypeOf<AtomStoreType<typeof storeAtom>>().toEqualTypeOf<
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

    expectTypeOf<AtomPromiseType<typeof storeAtom>>().toEqualTypeOf<
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
    const storeIon = ion('store', (_, p: string) => injectStore(p))
    const valueIon = ion('value', (_, p: string) => p)

    const storeInstance = ecosystem.getInstance(storeIon, ['a'])
    const valueInstance = ecosystem.getInstance(valueIon, ['a'])

    type StoreIonState = AtomStateType<typeof storeIon>
    type StoreIonParams = AtomParamsType<typeof storeIon>
    type StoreIonExports = AtomExportsType<typeof storeIon>
    type StoreIonPromise = AtomPromiseType<typeof storeIon>
    type StoreIonStore = AtomStoreType<typeof storeIon>
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

    type TStoreIonInstance = AtomInstanceType<typeof storeIon>
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

    expectTypeOf<StoreIonExports>().toEqualTypeOf<Record<string, never>>()
    expectTypeOf<StoreIonExports>().toEqualTypeOf<ValueIonExports>()
    expectTypeOf<StoreIonInstanceExports>().toEqualTypeOf<
      Record<string, never>
    >()
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
      AtomTemplateBase<
        {
          State: StoreIonState
          Params: StoreIonParams
          Exports: StoreIonExports
          Store: StoreIonStore
          Promise: StoreIonPromise
        },
        TStoreIonInstance
      >
    >()
    expectTypeOf<TValueIonInstance>().toEqualTypeOf<typeof storeInstance>()
    expectTypeOf<TValueIonTemplate>().toEqualTypeOf<
      AtomTemplateBase<
        {
          State: ValueIonState
          Params: ValueIonParams
          Exports: ValueIonExports
          Store: ValueIonStore
          Promise: ValueIonPromise
        },
        TValueIonInstance
      >
    >()
  })

  test('atom api inference in ions', () => {
    const storeIon = ion('store', (_, p: string) => {
      const store = injectStore(p)

      return api(store)
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

    expectTypeOf<AtomStateType<typeof storeIon>>().toBeString()
    expectTypeOf<AtomStateType<typeof valueIon>>().toBeString()
    expectTypeOf<AtomStateType<typeof queryIon>>().toEqualTypeOf<
      PromiseState<string>
    >()
    expectTypeOf<AtomStateType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      PromiseState<string>
    >()

    expectTypeOf<AtomParamsType<typeof storeIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParamsType<typeof valueIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParamsType<typeof queryIon>>().toEqualTypeOf<[p: string]>()
    expectTypeOf<AtomParamsType<typeof queryWithPromiseIon>>().toEqualTypeOf<
      [p: string]
    >()

    expectTypeOf<
      AtomExportsType<typeof storeIon>
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

    expectTypeOf<AtomStoreType<typeof storeIon>>().toEqualTypeOf<
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

    expectTypeOf<AtomPromiseType<typeof storeIon>>().toEqualTypeOf<
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

  test('AtomGenericsPartial - instances as params', () => {
    const innerAtom = atom('inner', 'a')

    const outerAtom = atom(
      'outer',
      (instance: AtomInstance<AtomGenericsPartial<{ State: string }>>) => {
        const val = injectAtomValue(instance) // subscribe to updates

        return val.toUpperCase()
      }
    )

    const innerInstance = ecosystem.getInstance(innerAtom)
    const outerInstance = ecosystem.getInstance(outerAtom, [innerInstance])
    const val = outerInstance.getState()

    expect(val).toBe('A')
    expectTypeOf<typeof innerInstance>().toMatchTypeOf<
      AtomInstance<{
        Exports: Record<string, never>
        Params: []
        State: string
        Store: Store<string>
        Promise: undefined
      }>
    >()

    expectTypeOf<typeof outerInstance>().toMatchTypeOf<
      AtomInstance<{
        Exports: Record<string, never>
        Params: [
          instance: AtomInstance<
            AtomGenericsPartial<{
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
    const allOptionalParamsAtom = atom(
      'allOptionalParams',
      (a?: boolean, b?: string[]) => {
        const store = injectStore(a ? b : 2)

        return store
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
      AtomInstance<{
        State: string
        Params: [p: string]
        Exports: {
          getBool: () => boolean
          getNum: () => number
        }
        Store: Store<string>
        Promise: Promise<number>
      }>
    >()
    expectTypeOf<typeof instance2>().toMatchTypeOf<
      AtomInstance<{
        State: number | string[] | undefined
        Params: [a?: boolean | undefined, b?: string[] | undefined]
        Exports: Record<string, never>
        Store: Store<number | string[] | undefined>
        Promise: undefined
      }>
    >()

    // @ts-expect-error has a required param, so params must be passed
    ecosystem.getInstance(someOptionalParamsAtom)

    // @ts-expect-error all params required, so params must be passed
    ecosystem.get(allRequiredParamsAtom)
  })

  test('accepting instances', () => {
    const getExampleVal = <I extends AtomInstanceType<typeof exampleAtom>>(
      i: I
    ) => i.getState()

    const getKey = <I extends AnyAtomInstance>(instance: I) =>
      instance.template.key

    const getUppercase = <I extends AnyAtomInstance<{ State: string }>>(
      instance: I
    ) => instance.getState().toUpperCase()

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
      <A extends AnyAtomTemplate>(
        template: A,
        params: AtomParamsType<A>
      ): AtomStateType<A>

      // no params ("singleton"):
      <A extends AnyAtomTemplate>(
        template: ParamlessTemplate<A>
      ): AtomStateType<A>

      // also accept instances:
      <I extends AnyAtomInstance>(instance: I): AtomStateType<I>
    } = <A extends AnyAtomTemplate | AnyAtomInstance>(
      template: A,
      params?: AtomParamsType<A>
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

      return api(injectStore(instance.getState())).setExports({
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
      val7: AtomApi<{
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
    const withEverything = api(store)
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
})
