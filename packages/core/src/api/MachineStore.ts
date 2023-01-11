import { RecursivePartial, Settable } from '../types'
import { MachineStateType } from '../utils/types'
import { Store } from './createStore'

/**
 * An extremely low-level Store class that represents a state machine. Don't
 * create this class yourself, use a helper such as @zedux/react's
 * `injectMachineStore()`
 */
export class MachineStore<
  StateNames extends string = string,
  EventNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> extends Store<MachineStateType<StateNames, Context>> {
  send: {
    [K in EventNames]: () => MachineStateType<StateNames, Context>
  }

  constructor(
    initialState: StateNames,
    states: Record<
      StateNames,
      Record<
        EventNames,
        { name: StateNames; guard?: (context: Context) => boolean }
      >
    >,
    eventNames: Set<EventNames>,
    initialContext?: Context
  ) {
    super(null, {
      context: initialContext as Context,
      value: initialState,
    })

    this.send = [...eventNames].reduce(
      (hash, eventName) => {
        hash[eventName as EventNames] = () =>
          this.setState(currentState => {
            const nextValue =
              states[currentState.value][eventName as EventNames]

            if (nextValue?.guard && !nextValue.guard(currentState.context)) {
              return currentState
            }

            return nextValue
              ? { context: currentState.context, value: nextValue.name }
              : currentState
          })

        return hash
      },
      {} as {
        [K in EventNames]: () => MachineStateType<StateNames, Context>
      }
    )
  }

  public getContext = () => this.getState().context

  public is = (stateName: StateNames) => this.getState().value === stateName

  public setContext = (context: Settable<Context>) =>
    this.setState(state => ({
      context: typeof context === 'function' ? context(state.context) : context,
      value: state.value,
    }))

  public setContextDeep = (
    partialContext: Settable<RecursivePartial<Context>, Context>
  ) =>
    this.setStateDeep(state => ({
      context:
        typeof partialContext === 'function'
          ? partialContext(state.context)
          : partialContext,
    }))
}
