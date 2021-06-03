// import { Context, createContext } from 'react'
// import {
//   injectAtomInstance,
//   injectAtomInstanceDynamic,
// } from '../injectors'
// import { getEcosystem } from '../store/public-api'
// import {
//   AsyncState,
//   AsyncStatus,
//   AtomType,
//   Query,
//   QueryAtom,
//   QueryAtomInstance,
// } from '../types'
// import { EMPTY_CONTEXT, generateImplementationId } from '../utils'
// import { diContext } from '../utils/csContexts'

// export const query = <State, Params extends any[]>(
//   key: string,
//   value: QueryAtom<State, Params>['value']
// ) => {
//   let reactContext: Context<QueryAtomInstance<State, Params>>
//   const getReactContext = () => {
//     if (reactContext) return reactContext

//     return (reactContext = createContext(EMPTY_CONTEXT as any))
//   }

//   const injectInstance = (...params: Params) =>
//     injectAtomInstance<
//       AsyncState<State>,
//       Params,
//       QueryAtomInstance<State, Params>
//     >(newAtom, params, 'injectInstance')

//   const injectQuery = (...params: Params) => {
//     const instance = injectAtomInstanceDynamic<
//       AsyncState<State>,
//       Params,
//       QueryAtomInstance<State, Params>
//     >(newAtom, params, 'injectQuery')

//     const state = instance.internals.stateStore.getState()
//     const query: Query<State, Params> = {
//       data: state.data,
//       error: state.error,
//       instance,
//       isError: state.status === AsyncStatus.Error,
//       isIdle: state.status === AsyncStatus.Idle,
//       isLoading: state.status === AsyncStatus.Loading,
//       isSuccess: state.status === AsyncStatus.Success,
//       status: state.status,
//     }

//     return query
//   }

//   const newAtom: QueryAtom<State, Params> = {
//     getReactContext,
//     injectInstance,
//     injectLazy,
//     injectQuery,
//     // injectSelector,
//     internalId: generateImplementationId(),
//     key,
//     // override,
//     // useConsumer,
//     // useInstance,
//     // useLazy,
//     // useQuery,
//     // useSelector,
//     type: AtomType.Query,
//     value,
//   } as any

//   return newAtom
// }
