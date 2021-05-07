import { useAtomWithoutSubscription, useAtomWithSubscription } from '../hooks'
import {
  injectAtomWithoutSubscription,
  injectAtomWithSubscription,
} from '../injectors'
import { AtomType, Molecule, MoleculeInstance } from '../types'
import { generateImplementationId } from '../utils'

export const molecule = <
  State = any,
  Exports extends Record<string, any> = Record<string, any>
>(
  key: string,
  value: Molecule<State, Exports>['value']
) => {
  const injectExports = () =>
    injectAtomWithoutSubscription<State, [], MoleculeInstance<State, Exports>>(
      'injectExports',
      newMolecule,
      []
    ).exports

  const injectState = () => {
    const instance = injectAtomWithSubscription<
      State,
      [],
      MoleculeInstance<State, Exports>
    >('injectState', newMolecule, [])

    return [
      instance.internals.stateStore.getState(),
      instance.internals.stateStore.setState,
      instance.internals.stateStore,
    ] as const
  }

  const injectStore = () =>
    injectAtomWithoutSubscription<State, [], MoleculeInstance<State, Exports>>(
      'injectStore',
      newMolecule,
      []
    ).internals.stateStore

  const override = (newValue: Molecule<State, Exports>['value']) =>
    molecule<State, Exports>(key, newValue)

  const useExports = () =>
    useAtomWithoutSubscription<State, [], MoleculeInstance<State, Exports>>(
      newMolecule,
      []
    ).exports

  const useState = () => {
    const instance = useAtomWithSubscription<
      State,
      [],
      MoleculeInstance<State, Exports>
    >(newMolecule, [])

    return [
      instance.internals.stateStore.getState(),
      instance.internals.stateStore.setState,
    ] as const
  }

  const useStore = () =>
    useAtomWithoutSubscription<State, [], MoleculeInstance<State, Exports>>(
      newMolecule,
      []
    ).internals.stateStore

  const newMolecule: Molecule<State, Exports> = {
    injectExports,
    injectState,
    injectStore,
    internalId: generateImplementationId(),
    key,
    override,
    type: AtomType.Molecule,
    useExports,
    useState,
    useStore,
    value,
  }

  return newMolecule
}
