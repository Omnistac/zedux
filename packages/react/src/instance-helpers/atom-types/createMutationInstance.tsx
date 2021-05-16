// import { createStore } from '@zedux/core'
// import { AsyncState, AsyncStatus } from '@zedux/react/types'
// import { EvaluationTargetType, EvaluationType } from '@zedux/react/utils'
// import { asyncMachine, cancel, reset } from '@zedux/react/utils/asyncMachine'
// import React, { FC } from 'react'
// import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

// export const createMutationInstance = <
//   State,
//   Params extends [],
//   MutationParams extends any[]
// >(
//   ecosystemId: string,
//   atom: MutationAtom<State, MutationParams>,
//   keyHash: string,
//   params: Params
// ) => {
//   let mutateRef: MutationAtomInstance<State, MutationParams>['mutate'] = () =>
//     undefined as any

//   const evaluate = () => {
//     const mutate = atom.value()

//     if (typeof mutate !== 'function') {
//       throw new TypeError('Zedux - Mutation factory must return a function')
//     }

//     mutateRef = mutate

//     return mutationInstance.store
//   }

//   const internals = createAtomInstanceInternals(
//     ecosystemId,
//     atom,
//     keyHash,
//     params,
//     evaluate
//   )

//   const Provider: FC = ({ children }) => {
//     const context = atom.getReactContext()

//     return (
//       <context.Provider value={mutationInstance}>{children}</context.Provider>
//     )
//   }

//   const mutationInstance: MutationAtomInstance<State, MutationParams> = {
//     cancel: () => mutationInstance.store.dispatch(cancel()),
//     invalidate: () =>
//       internals.scheduleEvaluation({
//         operation: 'invalidate',
//         targetType: EvaluationTargetType.Injector,
//         type: EvaluationType.CacheInvalidated,
//       }),
//     internals,
//     mutate: (...params: MutationParams) => mutateRef(...params),
//     Provider,
//     reset: () => mutationInstance.store.dispatch(reset()),
//     store: createStore<AsyncState<State>>(
//       { status: asyncMachine },
//       { data: undefined, error: undefined, status: AsyncStatus.Idle }
//     ),
//   }

//   return mutationInstance
// }
