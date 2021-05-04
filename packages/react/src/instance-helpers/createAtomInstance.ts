import {
  ActiveState,
  AtomBaseProperties,
  AtomInstanceBase,
  AtomType,
  Molecule,
  MutationAtom,
  QueryAtom,
  ReadonlyAtom,
  ReadonlyAtomInstance,
  ReadonlyLocalAtom,
} from '../types'
import { createLocalAtomInstance } from './atom-types/createLocalAtomInstance'
import { createStandardAtomInstance } from './atom-types/createStandardAtomInstance'
import { createExternalInstance } from './atom-types/createExternalInstance'
import { createMoleculeInstance } from './atom-types/createMoleculeInstance'
import { createMutationInstance } from './atom-types/createMutationInstance'
import { createQueryInstance } from './atom-types/createQueryInstance'
import { Ecosystem } from '../classes/Ecosystem'

const createTypedInstance = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  ecosystemId: string,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  keyHash: string,
  params: Params
) => {
  switch (atom.type) {
    case AtomType.External:
      return createExternalInstance(ecosystemId, atom, keyHash, params)
    case AtomType.Local:
      return createLocalAtomInstance(
        ecosystemId,
        atom as ReadonlyLocalAtom<
          State,
          Params,
          any,
          ReadonlyAtomInstance<State, Params, any>
        >,
        keyHash,
        params
      )
    case AtomType.Molecule:
      return createMoleculeInstance(
        ecosystemId,
        atom as Molecule<State, any>,
        keyHash,
        params
      )
    case AtomType.Mutation:
      return createMutationInstance(
        ecosystemId,
        atom as MutationAtom<State, any>,
        keyHash,
        []
      )
    case AtomType.Query:
      return createQueryInstance(
        ecosystemId,
        atom as QueryAtom<State, Params>,
        keyHash,
        params
      )
    case AtomType.Standard:
    default:
      return createStandardAtomInstance(
        ecosystemId,
        atom as ReadonlyAtom<
          State,
          Params,
          any,
          ReadonlyAtomInstance<State, Params, any>
        >,
        keyHash,
        params
      )
  }
}

export const createAtomInstance = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  ecosystem: Ecosystem,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  keyHash: string,
  params: Params = ([] as unknown) as Params
) => {
  const newAtomInstance = createTypedInstance(
    ecosystem.ecosystemId,
    atom,
    keyHash,
    params
  ) as InstanceType

  // const map = new WeakMap();
  // map.set(newAtomInstance, true);
  // map.set({ control: true }, true);
  // console.log({ key: atom.key, map });

  return newAtomInstance
}
