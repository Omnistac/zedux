import { RecursivePartial } from '../types'
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
    states: Record<StateNames, Record<EventNames, StateNames>>,
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

            return nextValue
              ? { context: currentState.context, value: nextValue }
              : currentState
          })

        return hash
      },
      {} as {
        [K in EventNames]: () => MachineStateType<StateNames, Context>
      }
    )
  }

  public setContext = (partialContext: RecursivePartial<Context>) =>
    this.setStateDeep({
      context: partialContext,
    })
}
