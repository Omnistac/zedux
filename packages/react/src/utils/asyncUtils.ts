import {
  Action,
  createActorFactory,
  createMachine,
  createStore,
  states,
} from '@zedux/core'
import { AsyncState, AsyncStatus } from '../types'

const createActor = createActorFactory('@zedux/react/asyncMachine')
const cancel = createActor('cancel')
const load = createActor('load')
const loadSuccess = createActor<any>('loadSuccess')
const loadError = createActor<Error>('loadError')
const reset = createActor('reset')

const [errorState, idleState, loadingState, successState] = states(
  AsyncStatus.Error,
  AsyncStatus.Idle,
  AsyncStatus.Loading,
  AsyncStatus.Success
)

const asyncMachine = createMachine<AsyncStatus>(
  idleState.on(load, loadingState),
  loadingState
    .on(loadSuccess, successState)
    .on(loadError, errorState)
    .on(cancel, idleState),
  successState.on(reset, idleState),
  errorState.on(reset, idleState)
)

const getInitialState = <T>(): AsyncState<T> => ({
  isError: false,
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  status: AsyncStatus.Idle,
})

const createReducer = <T>() => (
  state = getInitialState<T>(),
  action: Action
) => {
  let newStatus = asyncMachine(state.status, action)

  if (newStatus === state.status) return state

  if (action.type === cancel.type) {
    if (state.prevStatus === successState.type) {
      newStatus = successState.type
    } else if (state.prevStatus === errorState.type) {
      newStatus = errorState.type
    }
  }

  const newState = {
    ...state,
    isError: newStatus === AsyncStatus.Error,
    isIdle: newStatus === AsyncStatus.Idle,
    isLoading: newStatus === AsyncStatus.Loading,
    isSuccess: newStatus === AsyncStatus.Success,
    prevStatus: state.status,
    status: newStatus,
  }

  if (action.type === loadSuccess.type) {
    newState.data = action.payload
  }

  if (action.type === loadError.type) {
    newState.error = action.payload
  }

  return newState
}

const createAsyncStore = <T>() => createStore(createReducer<T>())

export const asyncUtils = {
  actions: {
    cancel,
    load,
    loadSuccess,
    loadError,
    reset,
  },
  createAsyncStore,
  states: AsyncStatus,
}
