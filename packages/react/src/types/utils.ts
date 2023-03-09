import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'

export type AnyAtomInstance = AtomInstance<any>
export type AnyAtomInstanceBase = AtomInstanceBase<
  any,
  AtomTemplateBase<any, AtomInstance<any>>
>
export type AnyAtomTemplate = AtomTemplateBase<any, any>
