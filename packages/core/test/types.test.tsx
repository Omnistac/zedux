import { Store } from '@zedux/core'
import { expectTypeOf } from 'expect-type'

type AcceptsStore<S extends Store<any>> = S

describe('core types', () => {
  test('classes that extend the Store class can have any state shape', () => {
    class CustomStore<State> extends Store<State> {}

    expectTypeOf<AcceptsStore<CustomStore<string[]>>>().toEqualTypeOf<
      Store<string[]>
    >()
    expectTypeOf<AcceptsStore<CustomStore<number>>>().toEqualTypeOf<
      Store<number>
    >()
    expectTypeOf<
      AcceptsStore<CustomStore<{ a: string[]; b: { c: number[] } }>>
    >().toEqualTypeOf<Store<{ a: string[]; b: { c: number[] } }>>()

    expectTypeOf<AcceptsStore<CustomStore<symbol>>>().toEqualTypeOf<
      Store<symbol>
    >()
    expectTypeOf<AcceptsStore<CustomStore<null>>>().toEqualTypeOf<Store<null>>()
    expectTypeOf<AcceptsStore<CustomStore<[string, string][]>>>().toEqualTypeOf<
      Store<[string, string][]>
    >()
  })
})
