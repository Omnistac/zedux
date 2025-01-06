import { RecursivePartial, Settable, Store } from '@zedux/core'
import { MachineStateShape } from './types'

/**
 * An extremely low-level Store class that represents a state machine. Don't
 * create this class yourself, use a helper such as @zedux/machine's
 * `injectMachineStore()`
 */
export class MachineStore<
  StateNames extends string = string,
  EventNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> extends Store<MachineStateShape<StateNames, Context>> {
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
    private readonly guard?: (
      currentState: MachineStateShape<StateNames, Context>,
      nextValue: StateNames
    ) => boolean
  ) {
    super(null, {
      context: initialContext as Context,
      value: initialState,
    })
  }

  public getContext = () => this.getState().context

  public getValue = () => this.getState().value

  public is = (stateName: StateNames) => this.getState().value === stateName

  public send = (eventName: EventNames, meta?: any) =>
    this.setState(currentState => {
      const nextValue = this.states[currentState.value][eventName]

      if (
        !nextValue ||
        (nextValue.guard && !nextValue.guard(currentState.context)) ||
        (this.guard && !this.guard(currentState, nextValue.name))
      ) {
        return currentState
      }

      return { context: currentState.context, value: nextValue.name }
    }, meta)

  public setContext = (context: Settable<Context>, meta?: any) =>
    this.setState(
      state => ({
        context:
          typeof context === 'function' ? context(state.context) : context,
        value: state.value,
      }),
      meta
    )

  public setContextDeep = (
    partialContext: Settable<RecursivePartial<Context>, Context>,
    meta?: any
  ) =>
    this.setStateDeep(
      state => ({
        context:
          typeof partialContext === 'function'
            ? partialContext(state.context)
            : partialContext,
      }),
      meta
    )
}
