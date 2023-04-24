import { Store } from '@zedux/core'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomApi } from '../classes/AtomApi'

export type AtomApiGenericsPartial<G extends Partial<AtomApiGenerics>> = Omit<
  AnyAtomApiGenerics,
  keyof G
> &
  G

export type AnyAtomApiGenerics = { [K in keyof AtomGenerics]: any }

export type AnyAtomGenerics = { [K in keyof AtomGenerics]: any }

export type AnyAtomApi<G extends Partial<AtomApiGenerics> | 'any' = 'any'> =
  AtomApi<G extends Partial<AtomApiGenerics> ? AtomApiGenericsPartial<G> : any>

export type AnyAtomInstance<G extends Partial<AtomGenerics> | 'any' = 'any'> =
  AtomInstance<G extends Partial<AtomGenerics> ? AtomGenericsPartial<G> : any>

export type AnyAtomTemplate<G extends Partial<AtomGenerics> | 'any' = 'any'> =
  AtomTemplateBase<
    G extends Partial<AtomGenerics> ? AtomGenericsPartial<G> : any,
    AnyAtomInstance<G>
  >

export type AtomApiGenerics = Omit<AtomGenerics, 'Params' | 'Store'> & {
  Store: Store<any> | undefined
}

export type AtomGenericsToAtomApiGenerics<G extends AtomGenerics> = Omit<
  G,
  'Params' | 'Store'
> & { Store: G['Store'] | undefined }

export interface AtomGenerics {
  Exports: Record<string, any>
  Params: any[]
  Promise: AtomApiPromise
  State: any
  Store: Store<any>
}

export type AtomGenericsPartial<G extends Partial<AtomGenerics>> = Omit<
  AnyAtomGenerics,
  keyof G
> &
  G

export type AtomApiPromise = Promise<any> | undefined

export type AtomExportsType<
  A extends AnyAtomApi | AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, any>
  ? G['Exports']
  : A extends AtomInstance<infer G>
  ? G['Exports']
  : A extends AtomApi<infer G>
  ? G['Exports']
  : never

export type AtomInstanceType<A extends AnyAtomTemplate> =
  A extends AtomTemplateBase<any, infer T> ? T : never

export type AtomParamsType<A extends AnyAtomTemplate | AnyAtomInstance> =
  A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
    ? G['Params']
    : A extends AtomInstance<infer G>
    ? G['Params']
    : never

export type AtomPromiseType<
  A extends AnyAtomApi | AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['Promise']
  : A extends AtomInstance<infer G>
  ? G['Promise']
  : A extends AtomApi<infer G>
  ? G['Promise']
  : never

export type AtomStateType<
  A extends AnyAtomApi | AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['State']
  : A extends AtomInstance<infer G>
  ? G['State']
  : A extends AtomApi<infer G>
  ? G['State']
  : never

export type AtomStoreType<
  A extends AnyAtomApi | AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['Store']
  : A extends AtomInstance<infer G>
  ? G['Store']
  : A extends AtomApi<infer G>
  ? G['Store']
  : never

export type AtomTemplateType<
  A extends AtomInstanceBase<any, AtomTemplateBase<any, AtomInstance<any>>>
> = A extends AtomInstanceBase<any, infer T> ? T : never
