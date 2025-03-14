import {
  AnyNonNullishValue,
  AtomGenerics as NewAtomGenerics,
  AtomGetters,
  SelectorTemplate,
  AtomTemplateBase,
  ZeduxNode,
  Prettify,
} from '@zedux/atoms'
import { Store } from '@zedux/core'
import { StoreAtomInstance } from './StoreAtomInstance'
import { StoreAtomApi } from './StoreAtomApi'
import { StoreAtomTemplate } from './StoreAtomTemplate'

export type AnyStoreAtomApiGenerics = { [K in keyof StoreAtomGenerics]: any }

export type AnyStoreAtomGenerics<
  G extends Partial<StoreAtomGenerics> = AnyNonNullishValue
> = Prettify<
  Omit<{ [K in keyof StoreAtomGenerics]: any }, keyof G> & {
    [K in keyof G]-?: G[K]
  }
>

export type AnyStoreAtomApi<
  G extends Partial<StoreAtomApiGenerics> | 'any' = 'any'
> = StoreAtomApi<
  G extends Partial<StoreAtomApiGenerics> ? StoreAtomApiGenericsPartial<G> : any
>

export type AnyStoreAtomInstance<
  G extends Partial<StoreAtomGenerics> | 'any' = 'any'
> = StoreAtomInstance<
  G extends Partial<StoreAtomGenerics>
    ? { Template: any } & AnyStoreAtomGenerics<
        { Template: AnyStoreAtomTemplate<G> } & G
      >
    : any
>

export type AnyStoreAtomTemplate<
  G extends Partial<StoreAtomGenerics> | 'any' = 'any'
> = AtomTemplateBase<
  G extends Partial<StoreAtomGenerics>
    ? {
        Node: AnyStoreAtomInstance<G>
      } & AnyStoreAtomGenerics<G & { Node: AnyStoreAtomInstance<G> }>
    : AnyStoreAtomGenerics
>

export type StoreAtomApiGenerics = Pick<
  StoreAtomGenerics,
  'Exports' | 'Promise' | 'State'
> & {
  Store: Store<any> | undefined
}

export type StoreAtomApiGenericsPartial<
  G extends Partial<StoreAtomApiGenerics>
> = Omit<AnyStoreAtomApiGenerics, keyof G> & G

export type StoreAtomApiPromise = Promise<any> | undefined

export type AtomEventsType<
  A extends AnyStoreAtomApi | AnyStoreAtomTemplate | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G['Events']
  : A extends ZeduxNode<infer G>
  ? G extends { Events: infer Events }
    ? Events
    : never
  : never

export type AtomExportsType<
  A extends AnyStoreAtomApi | AnyStoreAtomTemplate | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G['Exports']
  : A extends ZeduxNode<infer G>
  ? G extends { Exports: infer Exports }
    ? Exports
    : never
  : A extends StoreAtomApi<infer G>
  ? G['Exports']
  : never

export type StoreAtomGenericsToStoreAtomApiGenerics<
  G extends Pick<
    StoreAtomGenerics,
    'Events' | 'Exports' | 'Promise' | 'State' | 'Store'
  >
> = Pick<G, 'Exports' | 'Promise' | 'State'> & {
  Store: G['Store'] | undefined
}

export interface StoreAtomGenerics
  extends Omit<NewAtomGenerics, 'Node' | 'Template'> {
  Node: StoreAtomInstance<any>
  Store: Store<any>
  Template: StoreAtomTemplate<any>
}

export type AtomInstanceType<A extends AnyStoreAtomTemplate> =
  A extends AtomTemplateBase<infer G>
    ? G extends { Node: infer Node }
      ? Node
      : ZeduxNode<G>
    : never

export type AtomParamsType<
  A extends AnyStoreAtomTemplate | ZeduxNode | SelectorTemplate
> = A extends AtomTemplateBase<infer G>
  ? G['Params']
  : A extends ZeduxNode<infer G>
  ? G extends { Params: infer Params }
    ? Params
    : never
  : A extends SelectorTemplate<any, infer Params>
  ? Params
  : never

export type AtomPromiseType<
  A extends AnyStoreAtomApi | AnyStoreAtomTemplate | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G['Promise']
  : A extends ZeduxNode<infer G>
  ? G extends { Promise: infer Promise }
    ? Promise
    : never
  : A extends StoreAtomApi<infer G>
  ? G['Promise']
  : never

export type StoreAtomStateFactory<
  G extends Pick<
    StoreAtomGenerics,
    'Events' | 'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = (
  ...params: G['Params']
) =>
  | StoreAtomApi<StoreAtomGenericsToStoreAtomApiGenerics<G>>
  | G['Store']
  | G['State']

export type StoreAtomValueOrFactory<
  G extends Pick<
    StoreAtomGenerics,
    'Events' | 'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = StoreAtomStateFactory<G> | G['Store'] | G['State']

export type AtomStateType<
  A extends
    | AnyStoreAtomApi
    | AnyStoreAtomTemplate
    | SelectorTemplate
    | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G['State']
  : A extends ZeduxNode<infer G>
  ? G['State']
  : A extends StoreAtomApi<infer G>
  ? G['State']
  : A extends SelectorTemplate<infer State>
  ? State
  : never

export type AtomStoreType<
  A extends AnyStoreAtomApi | AnyStoreAtomTemplate | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G extends { Store: infer Store }
    ? Store
    : never
  : A extends ZeduxNode<infer G>
  ? G extends { Store: infer Store }
    ? Store
    : never
  : A extends StoreAtomApi<infer G>
  ? G['Store']
  : never

// TODO: Now that ZeduxNode has the Template generic, this G extends { Template
// ... } check shouldn't be necessary. Double check and remove.
export type AtomTemplateType<A extends ZeduxNode> = A extends ZeduxNode<infer G>
  ? G extends { Template: infer Template }
    ? Template
    : G extends StoreAtomGenerics
    ? AtomTemplateBase<G>
    : never
  : never

export type StoreIonStateFactory<
  G extends Omit<StoreAtomGenerics, 'Node' | 'Template'>
> = (
  getters: AtomGetters,
  ...params: G['Params']
) =>
  | StoreAtomApi<StoreAtomGenericsToStoreAtomApiGenerics<G>>
  | G['Store']
  | G['State']

/**
 * Part of the atom instance can be accessed during initial evaluation. The only
 * fields that are inaccessible are those that don't exist yet 'cause the
 * initial evaluation is supposed to create them.
 */
export type PartialStoreAtomInstance = Omit<
  AnyStoreAtomInstance,
  'api' | 'exports' | 'promise' | 'S'
>
