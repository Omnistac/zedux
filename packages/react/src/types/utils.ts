import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'

export type AnyAtom = AtomBase<
  any,
  any,
  any,
  any,
  any,
  AtomInstance<any, any, any, any, any>
>
export type AnyAtomInstance = AtomInstance<any, any, any, any, any>
export type AnyAtomInstanceBase = AtomInstanceBase<
  any,
  any,
  AtomBase<any, any, any, any, any, AtomInstance<any, any, any, any, any>>
>
