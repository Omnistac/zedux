import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AnyAtom } from './utils'

export type AtomExportsType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<
  any,
  any,
  infer T,
  any,
  any,
  AtomInstance<any, any, infer T, any, any>
>
  ? T
  : never

export type AtomInstanceType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<any, any, any, any, any, infer T> ? T : never

export type AtomParamsType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<any, infer T, any, any, any, any> ? T : never

export type AtomPromiseType<
  AtomType extends AnyAtom
> = AtomType extends AtomBase<
  any,
  any,
  any,
  any,
  infer T,
  AtomInstance<any, any, any, any, infer T>
>
  ? T
  : never

export type AtomStateType<AtomType extends AnyAtom> = AtomType extends AtomBase<
  infer T,
  any,
  any,
  any,
  any,
  AtomInstance<infer T, any, any, any, any>
>
  ? T
  : never

export type AtomStoreType<AtomType extends AnyAtom> = AtomType extends AtomBase<
  any,
  any,
  any,
  infer T,
  any,
  AtomInstance<any, any, any, infer T, any>
>
  ? T
  : never
