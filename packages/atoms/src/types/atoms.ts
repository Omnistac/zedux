import { Store } from '@zedux/core'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomApi } from '../classes/AtomApi'
import { GraphNode } from '../classes/GraphNode'
import { AnyNonNullishValue, AtomSelectorOrConfig, Prettify } from './index'
import { SelectorInstance } from '../classes/SelectorInstance'

export type AtomApiGenericsPartial<G extends Partial<AtomApiGenerics>> = Omit<
  AnyAtomApiGenerics,
  keyof G
> &
  G

export type AnyAtomApiGenerics = { [K in keyof AtomGenerics]: any }

export type AnyAtomGenerics<
  G extends Partial<AtomGenerics> = AnyNonNullishValue
> = Prettify<Omit<{ [K in keyof AtomGenerics]: any }, keyof G> & G>

export type AnyAtomApi<G extends Partial<AtomApiGenerics> | 'any' = 'any'> =
  AtomApi<G extends Partial<AtomApiGenerics> ? AtomApiGenericsPartial<G> : any>

export type AnyAtomInstance<G extends Partial<AtomGenerics> | 'any' = 'any'> =
  AtomInstance<
    G extends Partial<AtomGenerics>
      ? { Template: AnyAtomTemplate<G> } & AnyAtomGenerics<G>
      : any
  >

export type AnyAtomTemplate<G extends Partial<AtomGenerics> | 'any' = 'any'> =
  AtomTemplateBase<
    G extends Partial<AtomGenerics>
      ? { Node: AnyAtomInstance<G> } & AnyAtomGenerics<G>
      : any
  >

export type AtomApiGenerics = Pick<
  AtomGenerics,
  'Exports' | 'Promise' | 'State'
> & {
  Store: Store<any> | undefined
}

export type AtomGenericsToAtomApiGenerics<
  G extends Pick<AtomGenerics, 'Exports' | 'Promise' | 'State' | 'Store'>
> = Pick<G, 'Exports' | 'Promise' | 'State'> & { Store: G['Store'] | undefined }

export interface AtomGenerics {
  Exports: Record<string, any>
  Node: any
  Params: any[]
  Promise: AtomApiPromise
  State: any
  Store: Store<any>
  Template: any
}

export type AtomApiPromise = Promise<any> | undefined

export type AtomExportsType<
  A extends AnyAtomApi | AnyAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['Exports']
  : A extends GraphNode<infer G>
  ? G extends { Exports: infer Exports }
    ? Exports
    : never
  : A extends AtomApi<infer G>
  ? G['Exports']
  : never

export type AtomInstanceType<A extends AnyAtomTemplate> =
  A extends AtomTemplateBase<infer G>
    ? G extends { Node: infer Node }
      ? Node
      : GraphNode<G>
    : never

export type AtomParamsType<
  A extends AnyAtomTemplate | GraphNode | AtomSelectorOrConfig
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
  A extends AnyAtomApi | AnyAtomTemplate | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['Promise']
  : A extends GraphNode<infer G>
  ? G extends { Promise: infer Promise }
    ? Promise
    : never
  : A extends AtomApi<infer G>
  ? G['Promise']
  : never

export type AtomStateType<
  A extends AnyAtomApi | AnyAtomTemplate | AtomSelectorOrConfig | GraphNode
> = A extends AtomTemplateBase<infer G>
  ? G['State']
  : A extends GraphNode<infer G>
  ? G['State']
  : A extends AtomApi<infer G>
  ? G['State']
  : A extends AtomSelectorOrConfig<infer State>
  ? State
  : never

export type AtomStoreType<A extends AnyAtomApi | AnyAtomTemplate | GraphNode> =
  A extends AtomTemplateBase<infer G>
    ? G['Store']
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

export type NodeOf<A extends AnyAtomTemplate | AtomSelectorOrConfig> =
  A extends AtomTemplateBase<infer G>
    ? // this allows the Node generic to be extracted from functions that don't
      // even accept it but were passed one:
      G extends { Node: infer Node }
      ? Node
      : GraphNode<G>
    : A extends AtomSelectorOrConfig<infer State, infer Params>
    ? SelectorInstance<{
        Params: Params
        State: State
        Template: AtomSelectorOrConfig<State, Params>
      }>
    : never

export type SelectorGenerics = Pick<AtomGenerics, 'Params' | 'State'> & {
  Template: AtomSelectorOrConfig
}
