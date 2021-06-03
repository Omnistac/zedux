// import { Context, createContext } from 'react'
// import { useAtomInstanceDynamic } from '../hooks'
// import { injectAtomInstanceDynamic } from '../injectors'
// import {
//   AsyncState,
//   AsyncStatus,
//   AtomType,
//   Mutation,
//   MutationAtom,
//   MutationAtomInstance,
// } from '../types'
// import { EMPTY_CONTEXT, generateImplementationId } from '../utils'

// export const mutation = <State, MutationParams extends any[]>(
//   key: string,
//   value: MutationAtom<State, MutationParams>['value']
// ) => {
//   let reactContext: Context<MutationAtomInstance<State, MutationParams>>
//   const getReactContext = () => {
//     if (reactContext) return reactContext

//     return (reactContext = createContext(EMPTY_CONTEXT as any))
//   }

//   const injectMutation = () => {
//     const instance = injectAtomInstanceDynamic<
//       AsyncState<State>,
//       [],
//       MutationAtomInstance<State, MutationParams>
//     >(newAtom, [], 'injectMutation')

//     const state = instance.internals.stateStore.getState()
//     const mutation: Mutation<State, MutationParams> = {
//       data: state.data,
//       error: state.error,
//       instance,
//       isError: state.status === AsyncStatus.Error,
//       isIdle: state.status === AsyncStatus.Idle,
//       isLoading: state.status === AsyncStatus.Loading,
//       isSuccess: state.status === AsyncStatus.Success,
//       mutate: instance.mutate,
//       status: state.status,
//     }

//     return mutation
//   }

//   const override = (newValue: MutationAtom<State, MutationParams>['value']) =>
//     mutation(key, newValue)

//   const useMutation = () => {
//     const instance = useAtomInstanceDynamic<
//       AsyncState<State>,
//       [],
//       MutationAtomInstance<State, MutationParams>
//     >(newAtom, [])

//     const state = instance.internals.stateStore.getState()
//     const mutation: Mutation<State, MutationParams> = {
//       data: state.data,
//       error: state.error,
//       instance,
//       isError: state.status === AsyncStatus.Error,
//       isIdle: state.status === AsyncStatus.Idle,
//       isLoading: state.status === AsyncStatus.Loading,
//       isSuccess: state.status === AsyncStatus.Success,
//       mutate: instance.mutate,
//       status: state.status,
//     }

//     return mutation
//   }

//   const newAtom: MutationAtom<State, MutationParams> = {
//     getReactContext,
//     injectMutation,
//     internalId: generateImplementationId(),
//     key,
//     override,
//     type: AtomType.Mutation,
//     useMutation,
//     value,
//   }

//   return newAtom
// }
