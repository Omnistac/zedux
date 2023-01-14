import { MachineStoreConfig, RecursivePartial, Settable } from '../types'
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
  constructor(
    initialState: StateNames,
    public readonly states: Record<
      StateNames,
      Record<
        EventNames,
        { name: StateNames; guard?: (context: Context) => boolean }
      >
    >,
    initialContext?: Context,
    private readonly config?: MachineStoreConfig<
      StateNames,
      EventNames,
      Context
    >
  ) {
    super(null, {
      context: initialContext as Context,
      value: initialState,
    })
  }

  public getContext = () => this.getState().context

  public getValue = () => this.getState().value

  public is = (stateName: StateNames) => this.getState().value === stateName

  public send = (eventName: EventNames) => {
    this.setState(currentState => {
      const nextValue = this.states[currentState.value][eventName]

      if (
        !nextValue ||
        (nextValue?.guard && !nextValue.guard(currentState.context)) ||
        (this.config?.guard && !this.config.guard(currentState, nextValue.name))
      ) {
        return currentState
      }

      return { context: currentState.context, value: nextValue.name }
    })
  }

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
