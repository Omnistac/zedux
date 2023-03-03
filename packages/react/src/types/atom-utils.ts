import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AnyAtomInstance } from './utils'

export type AtomInstanceAtomType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<any, any, infer T> ? T : never

export type AtomInstanceExportsType<
  AtomInstanceType extends AnyAtomInstance
> = AtomInstanceType extends AtomInstance<any, any, infer T, any, any>
  ? T
  : never

export type AtomInstanceParamsType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<
  any,
  infer T,
  AtomBase<any, infer T, any, any, any, any>
>
  ? T
  : never

export type AtomInstancePromiseType<
  AtomInstanceType extends AnyAtomInstance
> = AtomInstanceType extends AtomInstance<any, any, any, any, infer T>
  ? T
  : never

export type AtomInstanceStateType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<infer T, any, any> ? T : never

export type AtomInstanceStoreType<
  AtomInstanceType extends AnyAtomInstance
> = AtomInstanceType extends AtomInstance<any, any, any, infer T, any>
  ? T
  : never
