import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AnyAtom, AnyAtomInstance, AnyAtomInstanceBase } from './utils'

export type AtomExportsType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<
  any,
  any,
  infer T,
  any,
  any,
  AtomInstance<any, any, infer T, any, any>
>
  ? T
  : A extends AtomInstance<any, any, infer T, any, any>
  ? T
  : never

export type AtomInstanceType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<any, any, any, any, any, infer T> ? T : never

export type AtomParamsType<
  A extends AnyAtom | AnyAtomInstanceBase
> = A extends AtomBase<any, infer T, any, any, any, any>
  ? T
  : A extends AtomInstanceBase<
      any,
      infer T,
      AtomBase<any, infer T, any, any, any, any>
    >
  ? T
  : never

export type AtomPromiseType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<
  any,
  any,
  any,
  any,
  infer T,
  AtomInstance<any, any, any, any, infer T>
>
  ? T
  : A extends AtomInstance<any, any, any, any, infer T>
  ? T
  : never

export type AtomStateType<
  A extends AnyAtom | AnyAtomInstanceBase
> = A extends AtomBase<
  infer T,
  any,
  any,
  any,
  any,
  AtomInstance<infer T, any, any, any, any>
>
  ? T
  : A extends AtomInstanceBase<infer T, any, any>
  ? T
  : never

export type AtomStoreType<
  A extends AnyAtom | AnyAtomInstance
> = A extends AtomBase<
  any,
  any,
  any,
  infer T,
  any,
  AtomInstance<any, any, any, infer T, any>
>
  ? T
  : A extends AtomInstance<any, any, any, infer T, any>
  ? T
  : never
