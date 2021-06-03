// import { useAtomInstance, useAtomInstanceDynamic } from '../hooks'
// import {
//   injectAtomInstance,
//   injectAtomInstanceDynamic,
// } from '../injectors'
// import { AtomType, Molecule, MoleculeInstance } from '../types'
// import { generateImplementationId } from '../utils'

// export const molecule = <
//   State = any,
//   Exports extends Record<string, any> = Record<string, any>
// >(
//   key: string,
//   value: Molecule<State, Exports>['value']
// ) => {
//   const injectExports = () =>
//     injectAtomInstance<State, [], MoleculeInstance<State, Exports>>(
//       newMolecule,
//       [],
//       'injectExports'
//     ).exports

//   const injectState = () => {
//     const instance = injectAtomInstanceDynamic<
//       State,
//       [],
//       MoleculeInstance<State, Exports>
//     >(newMolecule, [], 'injectState')

//     return [
//       instance.internals.stateStore.getState(),
//       instance.internals.stateStore.setState,
//       instance.internals.stateStore,
//     ] as const
//   }

//   const injectStore = () =>
//     injectAtomInstance<State, [], MoleculeInstance<State, Exports>>(
//       newMolecule,
//       [],
//       'injectStore'
//     ).internals.stateStore

//   const override = (newValue: Molecule<State, Exports>['value']) =>
//     molecule<State, Exports>(key, newValue)

//   const useExports = () =>
//     useAtomInstance<State, [], MoleculeInstance<State, Exports>>(
//       newMolecule,
//       []
//     ).exports

//   const useState = () => {
//     const instance = useAtomInstanceDynamic<
//       State,
//       [],
//       MoleculeInstance<State, Exports>
//     >(newMolecule, [])

//     return [
//       instance.internals.stateStore.getState(),
//       instance.internals.stateStore.setState,
//     ] as const
//   }

//   const useStore = () =>
//     useAtomInstance<State, [], MoleculeInstance<State, Exports>>(
//       newMolecule,
//       []
//     ).internals.stateStore

//   const newMolecule: Molecule<State, Exports> = {
//     injectExports,
//     injectState,
//     injectStore,
//     internalId: generateImplementationId(),
//     key,
//     override,
//     type: AtomType.Molecule,
//     useExports,
//     useState,
//     useStore,
//     value,
//   }

//   return newMolecule
// }
