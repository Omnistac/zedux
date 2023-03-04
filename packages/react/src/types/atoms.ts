import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AnyAtom, AnyAtomInstance, AnyAtomInstanceBase } from './utils'

export type AtomExportsType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<infer G, any>
  ? G['Exports']
  : A extends AtomInstance<infer G>
  ? G['Exports']
  : never

export type AtomInstanceType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<any, infer T> ? T : never

export type AtomParamsType<
  A extends AnyAtom | AnyAtomInstanceBase
> = A extends AtomBase<infer G, AtomInstance<infer G>>
  ? G['Params']
  : A extends AtomInstanceBase<any, infer At>
  ? AtomParamsType<At>
  : never

export type AtomPromiseType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<infer G, AtomInstance<infer G>>
  ? G['Promise']
  : A extends AtomInstance<infer G>
  ? G['Promise']
  : never

export type AtomStateType<
  A extends AnyAtom | AnyAtomInstanceBase
> = A extends AtomBase<infer G, AtomInstance<infer G>>
  ? G['State']
  : A extends AtomInstanceBase<infer T, any>
  ? T
  : never

export type AtomStoreType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<infer G, AtomInstance<infer G>>
  ? G['Store']
  : A extends AtomInstance<infer G>
  ? G['Store']
  : never

export type AtomTemplateType<
  A extends AnyAtomInstanceBase
> = A extends AtomInstanceBase<any, infer T> ? T : never
