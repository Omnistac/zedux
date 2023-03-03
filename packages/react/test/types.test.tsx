import { Store } from '@zedux/core'
import { api, atom, createEcosystem } from '@zedux/react/factories'
import { injectStore } from '@zedux/react/injectors'
import {
  AtomExportsType,
  AtomParamsType,
  AtomPromiseType,
  AtomStateType,
  AtomStoreType,
} from '@zedux/react/types'
import { expectTypeOf } from 'expect-type'

const example = atom('example', (p: string) => {
  const store = injectStore(p)

  return api(store)
    .setExports({
      getNum: () => 2,
    })
    .setPromise(Promise.resolve(2))
})

const ecosystem = createEcosystem({ id: 'root' })

afterEach(() => {
  ecosystem.reset()
})

describe('types', () => {
  test('atom generic getters', () => {
    const instance = ecosystem.getInstance(example, ['a'])

    type AtomState = AtomStateType<typeof example>
    type AtomParams = AtomParamsType<typeof example>
    type AtomExports = AtomExportsType<typeof example>
    type AtomPromise = AtomPromiseType<typeof example>
    type AtomStore = AtomStoreType<typeof example>

    type AtomInstanceState = AtomStateType<typeof instance>
    type AtomInstanceParams = AtomParamsType<typeof instance>
    type AtomInstanceExports = AtomExportsType<typeof instance>
    type AtomInstancePromise = AtomPromiseType<typeof instance>
    type AtomInstanceStore = AtomStoreType<typeof instance>

    expectTypeOf<AtomState>().toBeString()
    expectTypeOf<AtomState>().toEqualTypeOf<AtomInstanceState>()

    expectTypeOf<AtomParams>().items.toBeString()
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
  })
})
