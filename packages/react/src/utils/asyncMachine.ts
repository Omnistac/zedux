import {
  createActorFactory,
  createMachine,
  createStore,
  states,
} from '@zedux/core'
import { AsyncStatus } from '../types'

const createActor = createActorFactory('@zedux/react/asyncMachine')
export const cancel = createActor('cancel')
export const load = createActor('load')
export const loadSuccess = createActor<any>('loadSuccess')
export const loadError = createActor<Error>('loadError')
export const reset = createActor('reset')

export const [errorState, idleState, loadingState, successState] = states(
  AsyncStatus.Error,
  AsyncStatus.Idle,
  AsyncStatus.Loading,
  AsyncStatus.Success
)

export const asyncMachine = createMachine<AsyncStatus>(
  idleState.on(load, loadingState),
  loadingState
    .on(loadSuccess, successState)
    .on(loadError, errorState)
    .on(cancel, idleState),
  successState.on(reset, idleState),
  errorState.on(reset, idleState)
)

export const createAsyncMachineStore = () => createStore(asyncMachine)
