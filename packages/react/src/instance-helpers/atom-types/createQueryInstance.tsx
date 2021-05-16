// import { createStore } from '@zedux/core'
// import { AsyncState, AsyncStatus } from '@zedux/react/types'
// import { EvaluationTargetType, EvaluationType } from '@zedux/react/utils'
// import { asyncMachine, cancel } from '@zedux/react/utils/asyncMachine'
// import React, { FC } from 'react'
// import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

// export const createQueryInstance = <State, Params extends any[]>(
//   ecosystemId: string,
//   atom: QueryAtom<State, Params>,
//   keyHash: string,
//   params: Params
// ) => {
//   const evaluate = () => {
//     const run = atom.value(...params)

//     if (typeof run !== 'function') {
//       throw new TypeError('Zedux - Query factory must return a function')
//     }

//     // TODO: Not this. Make query's `run` and mutation's `mutate` part of their stores.
//     queryInstance.run = run

//     return queryInstance.store
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

//     return <context.Provider value={queryInstance}>{children}</context.Provider>
//   }

//   const queryInstance: QueryAtomInstance<State, Params> = {
//     cancel: () => queryInstance.store.dispatch(cancel()),
//     invalidate: () =>
//       internals.scheduleEvaluation({
//         operation: 'invalidate()',
//         targetType: EvaluationTargetType.Injector,
//         type: EvaluationType.CacheInvalidated,
//       }),
//     internals,
//     run: () => ({} as any), // temp no-op
//     Provider,
//     store: createStore<AsyncState<State>>(
//       { status: asyncMachine },
//       { data: undefined, error: undefined, status: AsyncStatus.Idle }
//     ),
//   }

//   return queryInstance
// }
