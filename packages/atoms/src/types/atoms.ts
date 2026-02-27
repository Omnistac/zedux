import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomApi } from '../classes/AtomApi'
import { ZeduxNode } from '../classes/ZeduxNode'
import {
  AnyNonNullishValue,
  SelectorTemplate,
  Prettify,
  Selectable,
} from './index'
import { SelectorInstance } from '../classes/SelectorInstance'
import type { Signal } from '../classes/Signal'
import { MappedSignal } from '../classes/MappedSignal'

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
      ? { Template: AnyAtomTemplate<G> } & AnyAtomGenerics<
          G & {
            Template: G['Template'] extends AnyAtomTemplate
              ? G['Template']
              : AnyAtomTemplate<G>
          }
        >
      : any
  >

export type AnyAtomTemplate<G extends Partial<AtomGenerics> | 'any' = 'any'> =
  AtomTemplateBase<
    G extends Partial<AtomGenerics>
      ? { Node: AnyAtomInstance<G> } & AnyAtomGenerics<
          G & {
            Node: G['Node'] extends AnyAtomInstance
              ? G['Node']
              : AnyAtomInstance<G>
          }
        >
      : any
  >

export type AnySignal<G extends Partial<NodeGenerics> | 'any' = 'any'> = Signal<
  G extends Partial<NodeGenerics>
    ? {
        Events: G extends { Events: infer E } ? E : any
        Params: G extends { Params: infer P } ? P : any
        State: G extends { State: infer S } ? S : any
        Template: G extends { Template: infer T } ? T : any
      }
    : any
>

export type AnyNodeGenerics<
  G extends Partial<NodeGenerics> = { [K in keyof NodeGenerics]: any }
> = {
  [K in keyof NodeGenerics]: keyof G extends K ? G[K] : any
}

export type AtomApiGenerics = Pick<
  AtomGenerics,
  'Exports' | 'Promise' | 'State'
> & {
  Signal: Signal | undefined
}

export type AtomGenericsToAtomApiGenerics<
  G extends Pick<AtomGenerics, 'Events' | 'Exports' | 'Promise' | 'State'>
> = Pick<G, 'Exports' | 'Promise' | 'State'> & {
  Signal: AnySignal<Pick<G, 'Events' | 'State'>> | undefined
}

export interface AtomGenerics {
  Events: Record<string, any>
  Exports: Record<string, any>
  Node: any
  Params: any
  Promise: AtomApiPromise
  State: any
  Template: any
}

export type AtomApiPromise = Promise<any> | undefined

export type EventsOf<A extends AnyAtomApi | AnyAtomTemplate | ZeduxNode> =
  A extends AtomTemplateBase<infer G>
    ? G['Events']
    : A extends ZeduxNode<infer G>
    ? G['Events']
    : A extends Signal<infer G>
    ? G['Events']
    : A extends MappedSignal<infer G>
    ? G['Events']
    : A extends AtomApi<infer G>
    ? G['Signal'] extends Signal
      ? EventsOf<G['Signal']>
      : never
    : A extends SelectorTemplate<infer Events>
    ? Events
    : never

export type ExportsOf<A extends AnyAtomApi | AnyAtomTemplate | ZeduxNode> =
  A extends AtomTemplateBase<infer G>
    ? G['Exports']
    : A extends ZeduxNode<infer G>
    ? G extends { Exports: infer Exports }
      ? Exports
      : never
    : A extends AtomApi<infer G>
    ? G['Exports']
    : never

export type GenericsOf<A extends ZeduxNode | AtomTemplateBase> =
  A extends ZeduxNode<infer G>
    ? G
    : A extends AtomTemplateBase<infer G>
    ? G
    : never

export type NodeGenerics = Pick<
  AtomGenerics,
  'Events' | 'Params' | 'State' | 'Template'
>

export type NodeOf<A extends AnyAtomTemplate | Selectable<any, any>> =
  A extends AtomTemplateBase<infer G>
    ? // this allows the Node generic to be extracted from functions that don't
      // even accept it but were passed one:
      G extends { Node: infer Node }
      ? Node
      : ZeduxNode<G>
    : A extends Selectable<infer State, infer Params>
    ? SelectorInstance<{
        Params: Params
        State: State
        Template: SelectorTemplate<State, Params>
      }>
    : never

export type ParamsOf<A extends AnyAtomTemplate | ZeduxNode | SelectorTemplate> =
  A extends AtomTemplateBase<infer G>
    ? G['Params']
    : A extends ZeduxNode<infer G>
    ? G extends { Params: infer Params }
      ? Params
      : never
    : A extends SelectorTemplate<any, infer Params>
    ? Params
    : never

export type PromiseOf<A extends AnyAtomApi | AnyAtomTemplate | ZeduxNode> =
  A extends AtomTemplateBase<infer G>
    ? G['Promise']
    : A extends ZeduxNode<infer G>
    ? G extends { Promise: infer Promise }
      ? Promise
      : never
    : A extends AtomApi<infer G>
    ? G['Promise']
    : never

export type ResolvedStateOf<A extends AnyAtomTemplate | ZeduxNode> =
  A extends AtomTemplateBase<infer G>
    ? G extends { ResolvedState: infer R }
      ? R
      : StateOf<A>
    : A extends ZeduxNode<{
        Events: any
        Params: any
        ResolvedState: infer R
        State: any
        Template: any
      }>
    ? R
    : StateOf<A>

export type SelectorGenerics = Pick<AtomGenerics, 'State'> & {
  Params: any[]
  Template: SelectorTemplate
}

export type StateOf<
  A extends AnyAtomApi | AnyAtomTemplate | SelectorTemplate | ZeduxNode
> = A extends AtomTemplateBase<infer G>
  ? G['State']
  : A extends ZeduxNode<infer G>
  ? G['State']
  : A extends Signal<infer G>
  ? G['State']
  : A extends MappedSignal<infer G>
  ? G['State']
  : A extends AtomApi<infer G>
  ? G['State']
  : A extends SelectorTemplate<infer State>
  ? State
  : never

// TODO: Now that ZeduxNode has the Template generic, this G extends { Template
// ... } check shouldn't be necessary. Double check and remove.
export type TemplateOf<A extends ZeduxNode> = A extends ZeduxNode<infer G>
  ? G extends { Template: infer Template }
    ? Template
    : G extends AtomGenerics
    ? AtomTemplateBase<G>
    : never
  : never
