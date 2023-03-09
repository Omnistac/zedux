import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AnyAtomInstance, AnyAtomInstanceBase, AnyAtomTemplate } from './utils'

export type AtomExportsType<
  A extends AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, any>
  ? G['Exports']
  : A extends AtomInstance<infer G>
  ? G['Exports']
  : never

export type AtomInstanceType<
  A extends AnyAtomTemplate
> = A extends AtomTemplateBase<any, infer T> ? T : never

export type AtomParamsType<
  A extends AnyAtomTemplate | AnyAtomInstanceBase
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['Params']
  : A extends AtomInstanceBase<any, infer AtomTemplateType>
  ? AtomParamsType<AtomTemplateType>
  : never

export type AtomPromiseType<
  A extends AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['Promise']
  : A extends AtomInstance<infer G>
  ? G['Promise']
  : never

export type AtomStateType<
  A extends AnyAtomTemplate | AnyAtomInstanceBase
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['State']
  : A extends AtomInstanceBase<infer T, any>
  ? T
  : never

export type AtomStoreType<
  A extends AnyAtomTemplate | AnyAtomInstance
> = A extends AtomTemplateBase<infer G, AtomInstance<infer G>>
  ? G['Store']
  : A extends AtomInstance<infer G>
  ? G['Store']
  : never

export type AtomTemplateType<
  A extends AnyAtomInstanceBase
> = A extends AtomInstanceBase<any, infer T> ? T : never
