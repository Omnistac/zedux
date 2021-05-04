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
  params: Params,
  destroy: () => void
) => {
  switch (atom.type) {
    case AtomType.External:
      return createExternalInstance(ecosystemId, atom, keyHash, params, destroy)
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
        params,
        destroy
      )
    case AtomType.Molecule:
      return createMoleculeInstance(
        ecosystemId,
        atom as Molecule<State, any>,
        keyHash,
        params,
        destroy
      )
    case AtomType.Mutation:
      return createMutationInstance(
        ecosystemId,
        atom as MutationAtom<State, any>,
        keyHash,
        [],
        destroy
      )
    case AtomType.Query:
      return createQueryInstance(
        ecosystemId,
        atom as QueryAtom<State, Params>,
        keyHash,
        params,
        destroy
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
        params,
        destroy
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
  const destroy = () => {
    // TODO: dispatch an action over stateStore for this mutation
    newAtomInstance.internals.activeState = ActiveState.Destroyed

    ecosystem.destroyAtomInstance(keyHash)

    newAtomInstance.internals.injectors.forEach(injector => {
      injector.cleanup?.()
    })

    newAtomInstance.internals.subscription?.unsubscribe()

    // TODO: any other cleanup items? (subscriptions to remove, timeouts to cancel, etc)
  }

  const newAtomInstance = createTypedInstance(
    ecosystem.ecosystemId,
    atom,
    keyHash,
    params,
    destroy
  ) as InstanceType

  // const map = new WeakMap();
  // map.set(newAtomInstance, true);
  // map.set({ control: true }, true);
  // console.log({ key: atom.key, map });

  return newAtomInstance
}
