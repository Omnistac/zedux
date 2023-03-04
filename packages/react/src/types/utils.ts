import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'

export type AnyAtom = AtomBase<any, any>
export type AnyAtomInstance = AtomInstance<any>
export type AnyAtomInstanceBase = AtomInstanceBase<
  any,
  AtomBase<any, AtomInstance<any>>
>
