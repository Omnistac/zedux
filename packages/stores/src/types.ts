import {
  AnyNonNullishValue,
  AtomGenerics as NewAtomGenerics,
  AtomGetters,
  AtomSelectorOrConfig,
  AtomTemplateBase,
  GraphNode,
  Prettify,
} from '@zedux/atoms'
import { Store } from '@zedux/core'
import { AtomInstance } from './AtomInstance'
import { AtomApi } from './AtomApi'

export type AnyAtomApiGenerics = { [K in keyof AtomGenerics]: any }

export type AnyAtomGenerics<
  G extends Partial<AtomGenerics> = AnyNonNullishValue
> = Prettify<Omit<{ [K in keyof AtomGenerics]: any }, keyof G> & G>

export type AnyAtomApi<G extends Partial<AtomApiGenerics> | 'any' = 'any'> =
  AtomApi<G extends Partial<AtomApiGenerics> ? AtomApiGenericsPartial<G> : any>

export type AnyStoreAtomInstance<
  G extends Partial<AtomGenerics> | 'any' = 'any'
> = AtomInstance<
  G extends Partial<AtomGenerics>
    ? { Template: AnyStoreAtomTemplate<G> } & AnyAtomGenerics<G>
    : any
>

export type AnyStoreAtomTemplate<
  G extends Partial<AtomGenerics> | 'any' = 'any'
> = AtomTemplateBase<
  G extends Partial<AtomGenerics>
    ? { Node: AnyStoreAtomInstance<G> } & AnyAtomGenerics<G>
    : any
>

export type AtomApiGenerics = Pick<
  AtomGenerics,
  'Exports' | 'Promise' | 'State'
> & {
  Store: Store<any> | undefined
}

export type AtomApiGenericsPartial<G extends Partial<AtomApiGenerics>> = Omit<
  AnyAtomApiGenerics,
  keyof G
> &
  G

export type AtomGenericsToAtomApiGenerics<
  G extends Pick<
    AtomGenerics,
    'Events' | 'Exports' | 'Promise' | 'State' | 'Store'
  >
> = Pick<G, 'Exports' | 'Promise' | 'State'> & {
  Store: G['Store'] | undefined
}

export interface AtomGenerics extends NewAtomGenerics {
  Store: Store<any>
}

export type AtomApiPromise = Promise<any> | undefined

export type AtomEventsType<
  A extends AnyAtomApi | AnyStoreAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['Events']
  : A extends GraphNode<infer G>
  ? G extends { Events: infer Events }
    ? Events
    : never
  : never

export type AtomExportsType<
  A extends AnyAtomApi | AnyStoreAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['Exports']
  : A extends GraphNode<infer G>
  ? G extends { Exports: infer Exports }
    ? Exports
    : never
  : A extends AtomApi<infer G>
  ? G['Exports']
  : never

export type AtomInstanceType<A extends AnyStoreAtomTemplate> =
  A extends AtomTemplateBase<infer G>
    ? G extends { Node: infer Node }
      ? Node
      : GraphNode<G>
    : never

export type AtomParamsType<
  A extends AnyStoreAtomTemplate | GraphNode | AtomSelectorOrConfig
> = A extends AtomTemplateBase<infer G>
  ? G['Params']
  : A extends GraphNode<infer G>
  ? G extends { Params: infer Params }
    ? Params
    : never
  : A extends AtomSelectorOrConfig<any, infer Params>
  ? Params
  : never

export type AtomPromiseType<
  A extends AnyAtomApi | AnyStoreAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['Promise']
  : A extends GraphNode<infer G>
  ? G extends { Promise: infer Promise }
    ? Promise
    : never
  : A extends AtomApi<infer G>
  ? G['Promise']
  : never

export type AtomStateFactory<
  G extends Pick<
    AtomGenerics,
    'Events' | 'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = (
  ...params: G['Params']
) => AtomApi<AtomGenericsToAtomApiGenerics<G>> | G['Store'] | G['State']

export type AtomValueOrFactory<
  G extends Pick<
    AtomGenerics,
    'Events' | 'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = AtomStateFactory<G> | G['Store'] | G['State']

export type AtomStateType<
  A extends AnyAtomApi | AnyStoreAtomTemplate | AtomSelectorOrConfig | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['State']
  : A extends GraphNode<infer G>
  ? G['State']
  : A extends AtomApi<infer G>
  ? G['State']
  : A extends AtomSelectorOrConfig<infer State>
  ? State
  : never

export type AtomStoreType<
  A extends AnyAtomApi | AnyStoreAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G extends { Store: infer Store }
    ? Store
    : never
  : A extends GraphNode<infer G>
  ? G extends { Store: infer Store }
    ? Store
    : never
  : A extends AtomApi<infer G>
  ? G['Store']
  : never

// TODO: Now that GraphNode has the Template generic, this G extends { Template
// ... } check shouldn't be necessary. Double check and remove.
export type AtomTemplateType<A extends GraphNode> = A extends GraphNode<infer G>
  ? G extends { Template: infer Template }
    ? Template
    : G extends AtomGenerics
    ? AtomTemplateBase<G>
    : never
  : never

export type IonStateFactory<G extends Omit<AtomGenerics, 'Node' | 'Template'>> =
  (
    getters: AtomGetters,
    ...params: G['Params']
  ) => AtomApi<AtomGenericsToAtomApiGenerics<G>> | G['Store'] | G['State']

export type SelectorGenerics = Pick<AtomGenerics, 'State'> & {
  Params: any[]
  Template: AtomSelectorOrConfig
}
