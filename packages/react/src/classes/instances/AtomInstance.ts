import {
  ActionChain,
  createStore,
  Dispatchable,
  internalTypes,
  is,
  Observable,
  RecursivePartial,
  Settable,
  Store,
  Subscription,
} from '@zedux/core'
import {
  AtomGenerics,
  Cleanup,
  EvaluationReason,
  EvaluationSourceType,
  ExportsInfusedSetter,
  LifecycleStatus,
  PromiseState,
  PromiseStatus,
} from '@zedux/react/types'
import { pluginActions } from '@zedux/react/utils/plugin-actions'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '@zedux/react/utils/promiseUtils'
import { InjectorDescriptor } from '@zedux/react/utils/types'
import { Ecosystem } from '../Ecosystem'
import { AtomApi } from '../AtomApi'
import { AtomInstanceBase } from './AtomInstanceBase'
import { AtomTemplateBase } from '../templates/AtomTemplateBase'

const StoreState = 1
const RawState = 2

const getStateType = (val: any) => {
  if (is(val, Store)) return StoreState

  return RawState
}

const getStateStore = <
  State = any,
  StoreType extends Store<State> = Store<State>,
  P extends State | StoreType = State | StoreType
>(
  factoryResult: P
) => {
  const stateType = getStateType(factoryResult)

  const stateStore =
    stateType === StoreState
      ? (factoryResult as StoreType)
      : (createStore<State>() as StoreType)

  // define how we populate our store (doesn't apply to user-supplied stores)
  if (stateType === RawState) {
    stateStore.setState(
      typeof factoryResult === 'function'
        ? () => factoryResult as State
        : (factoryResult as State)
    )
  }

  return [stateType, stateStore] as const
}

export class AtomInstance<G extends AtomGenerics> extends AtomInstanceBase<
  G['State'],
  AtomTemplateBase<G, AtomInstance<G>>
> {
  public status: LifecycleStatus = 'Initializing'
  public api?: AtomApi<G['State'], G['Exports'], G['Store'], G['Promise']>
  public exports: G['Exports']
  public promise: G['Promise']
  public store: G['Store']

  public _cancelDestruction?: Cleanup
  public _createdAt = Date.now()
  public _injectors?: InjectorDescriptor[]
  public _nextEvaluationReasons: EvaluationReason[] = []
  public _nextInjectors?: InjectorDescriptor[]
  public _prevEvaluationReasons?: EvaluationReason[]
  public _promiseError?: Error
  public _promiseStatus?: PromiseStatus
  public _stateType?: 1 | 2

  private _bufferedUpdate?: {
    newState: G['State']
    oldState?: G['State']
    action: ActionChain
  }
  private _subscription?: Subscription

  constructor(
    public readonly ecosystem: Ecosystem,
    public readonly template: AtomTemplateBase<G, AtomInstance<G>>,
    public readonly id: string,
    public readonly params: G['Params']
  ) {
    super()

    // lol
    this.exports = (this as any).exports
    this.promise = (this as any).promise
    this.store = (this as any).store
    this._promiseStatus = (this as any)._promiseStatus
  }

  /**
   * Detach this atom instance from the ecosystem and clean up all graph edges
   * and other subscriptions/effects created by this atom instance.
   *
   * Destruction will bail out if this atom instance still has dependents. Pass
   * `true` to force-destroy the atom instance anyway.
   */
  public destroy(force?: boolean) {
    if (this.status === 'Destroyed') return

    // If we're not force-destroying, don't destroy if there are dependents
    if (
      !force &&
      Object.keys(this.ecosystem._graph.nodes[this.id]?.dependents || {}).length
    ) {
      return
    }

    this._cancelDestruction?.()
    this._cancelDestruction = undefined

    this._setStatus('Destroyed')

    if (this._nextEvaluationReasons.length) {
      this.ecosystem._scheduler.unschedule(this.evaluationTask)
    }

    // Clean up effect injectors first, then everything else
    const nonEffectInjectors: InjectorDescriptor[] = []
    this._injectors?.forEach(injector => {
      if (injector.type !== '@@zedux/effect') {
        nonEffectInjectors.push(injector)
        return
      }
      injector.cleanup?.()
    })
    nonEffectInjectors.forEach(injector => {
      injector.cleanup?.()
    })

    this.ecosystem._graph.removeDependencies(this.id)
    this._subscription?.unsubscribe()
    this.ecosystem._destroyAtomInstance(this.id)
  }

  /**
   * An alias for `.store.dispatch()`
   */
  public dispatch = (action: Dispatchable) => this.store.dispatch(action)

  /**
   * An alias for `instance.store.getState()`. Returns the current state of this
   * atom instance's store.
   */
  public getState(): G['State'] {
    return this.store.getState()
  }

  // a small, memory-efficient bound function property we can pass around
  public invalidate = (operation?: string, sourceType?: EvaluationSourceType) =>
    this._invalidate(operation, sourceType)

  /**
   * An alias for `.store.setState()`
   */
  public setState = (settable: Settable<G['State']>, meta?: any): G['State'] =>
    this.store.setState(settable, meta)

  /**
   * An alias for `.store.setStateDeep()`
   */
  public setStateDeep = (
    settable: Settable<RecursivePartial<G['State']>, G['State']>,
    meta?: any
  ): G['State'] => this.store.setStateDeep(settable, meta)

  public _set?: ExportsInfusedSetter<G['State'], G['Exports']>
  public get _infusedSetter() {
    if (this._set) return this._set
    const setState: any = (settable: any, meta?: any) =>
      this.setState(settable, meta)

    return (this._set = Object.assign(setState, this.exports))
  }

  public _init() {
    const factoryResult = this._doEvaluate()

    ;[this._stateType, this.store] = getStateStore(factoryResult)

    this._subscription = this.store.subscribe((newState, oldState, action) => {
      // buffer updates (with cache size of 1) if this instance is currently
      // evaluating
      if (this.ecosystem._evaluationStack.isEvaluating(this.id)) {
        this._bufferedUpdate = { newState, oldState, action }
        return
      }

      this._handleStateChange(newState, oldState, action)
    })

    this._setStatus('Active')

    // hydrate if possible
    if (!this.ecosystem.hydration || this.template.manualHydration) return

    const hydration = this.ecosystem._consumeHydration(this)

    if (typeof hydration === 'undefined') return

    this.store.setState(hydration)
  }

  /**
   * When a standard atom instance's refCount hits 0 and a ttl is set, we set a
   * timeout to destroy this atom instance.
   */
  public _scheduleDestruction() {
    // the atom is already scheduled for destruction or destroyed
    if (this.status !== 'Active') return

    this._setStatus('Stale')

    const ttl = this._getTtl()
    if (ttl == null || ttl === -1) return
    if (ttl === 0) return this.destroy()

    if (typeof ttl === 'number') {
      // ttl is > 0; schedule destruction
      const timeoutId = setTimeout(() => {
        this._cancelDestruction = undefined
        this.destroy()
      }, ttl)

      // TODO: dispatch an action over stateStore for these mutations
      this._cancelDestruction = () => {
        this._cancelDestruction = undefined
        clearTimeout(timeoutId)
      }

      return
    }

    if (typeof (ttl as Promise<any>).then === 'function') {
      let isCanceled = false
      ;(ttl as Promise<any>).then(() => {
        this._cancelDestruction = undefined
        if (!isCanceled) this.destroy()
      })

      this._cancelDestruction = () => {
        this._cancelDestruction = undefined
        isCanceled = true
      }

      return
    }

    // ttl is an observable; destroy as soon as it emits
    const subscription = (ttl as Observable).subscribe(() => {
      this._cancelDestruction = undefined
      this.destroy()
    })

    this._cancelDestruction = () => {
      this._cancelDestruction = undefined
      subscription.unsubscribe()
    }
  }

  public _scheduleEvaluation = (
    reason: EvaluationReason,
    shouldSetTimeout?: boolean
  ) => {
    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them. TODO: Can we pause evaluations while
    // status is Stale (and should we just always evaluate once when
    // waking up a stale atom)?
    if (this.status === 'Destroyed') return

    this._nextEvaluationReasons.push(reason)

    if (this._nextEvaluationReasons.length > 1) return // job already scheduled

    this.ecosystem._scheduler.schedule(
      {
        id: this.id,
        task: this.evaluationTask,
        type: 2, // EvaluateGraphNode (2)
      },
      shouldSetTimeout
    )
  }

  private evaluationTask = () => this._evaluationTask()

  private _doEvaluate(): G['Store'] | G['State'] {
    this._nextInjectors = []
    let newFactoryResult: G['Store'] | G['State']
    this.ecosystem._evaluationStack.start(this)
    this.ecosystem._graph.bufferUpdates(this.id)

    try {
      newFactoryResult = this._evaluate()
    } catch (err) {
      this._nextInjectors.forEach(injector => {
        injector.cleanup?.()
      })

      this._nextInjectors = undefined
      this.ecosystem._graph.destroyBuffer()

      throw err
    } finally {
      this.ecosystem._evaluationStack.finish()

      // even if evaluation errored, we need to update dependents if the store's
      // state changed
      if (this._bufferedUpdate) {
        this._handleStateChange(
          this._bufferedUpdate.newState,
          this._bufferedUpdate.oldState,
          this._bufferedUpdate.action
        )
        this._bufferedUpdate = undefined
      }

      this._prevEvaluationReasons = this._nextEvaluationReasons
      this._nextEvaluationReasons = []
    }

    this._injectors = this._nextInjectors
    this._nextInjectors = undefined
    this.ecosystem._graph.flushUpdates()

    return newFactoryResult
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi
   */
  private _evaluate() {
    const { _value } = this.template

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (_value as (
        ...params: G['Params']
      ) =>
        | G['Store']
        | G['State']
        | AtomApi<G['State'], G['Exports'], G['Store'], G['Promise']>)(
        ...this.params
      )

      if (!is(val, AtomApi)) return val as G['Store'] | G['State']

      const api = (this.api = val as AtomApi<
        G['State'],
        G['Exports'],
        G['Store'],
        G['Promise']
      >)

      // Exports can only be set on initial evaluation
      if (this.status === 'Initializing' && api.exports) {
        const exports = api.exports

        // wrap exported functions in ecosystem.batch by default
        this.exports = api.wrap
          ? Object.keys(exports).reduce((obj, key: keyof G['Exports']) => {
              const val = exports[key]
              obj[key] =
                typeof val === 'function'
                  ? (((...args: any) =>
                      this.ecosystem.batch(() =>
                        val(...args)
                      )) as G['Exports'][typeof key])
                  : val
              return obj
            }, {} as G['Exports'])
          : exports
      }

      // if api.value is a promise, we ignore api.promise
      if (
        typeof ((api.value as unknown) as Promise<any>)?.then === 'function'
      ) {
        return this._setPromise((api.value as unknown) as Promise<any>, true)
      } else if (api.promise) {
        this._setPromise(api.promise)
      }

      return api.value as G['Store'] | G['State']
    } catch (err) {
      console.error(
        `Zedux: Error while evaluating atom "${this.template.key}" with params:`,
        this.params,
        err
      )

      throw err
    }
  }

  private _evaluationTask() {
    const newFactoryResult = this._doEvaluate()

    const newStateType = getStateType(newFactoryResult)

    if (DEV && newStateType !== this._stateType) {
      throw new Error(
        `Zedux: atom factory for atom "${this.template.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
      )
    }

    if (DEV && newStateType === StoreState && newFactoryResult !== this.store) {
      throw new Error(
        `Zedux: atom factory for atom "${this.template.key}" returned a different store. Did you mean to use \`injectStore()\`, or \`injectMemo()\`?`
      )
    }

    // there is no way to cause an evaluation loop when the StateType is Value
    if (newStateType === RawState) {
      this.store.setState(
        typeof newFactoryResult === 'function'
          ? () => newFactoryResult as G['State']
          : (newFactoryResult as G['State'])
      )
    }
  }

  private _getTtl() {
    if (this.api?.ttl == null) {
      return this.template.ttl ?? this.ecosystem.defaultTtl
    }

    // this atom instance set its own ttl
    const { ttl } = this.api

    return typeof ttl === 'function' ? ttl() : ttl
  }

  private _handleStateChange(
    newState: G['State'],
    oldState: G['State'] | undefined,
    action: ActionChain
  ) {
    this.ecosystem._graph.scheduleDependents(
      this.id,
      this._nextEvaluationReasons,
      newState,
      oldState,
      false
    )

    if (this.ecosystem._mods.stateChanged) {
      this.ecosystem.modBus.dispatch(
        pluginActions.stateChanged({
          action,
          instance: this,
          newState,
          oldState,
          reasons: this._nextEvaluationReasons,
        })
      )
    }

    // run the scheduler synchronously after any atom instance state update
    if (action.meta !== internalTypes.batch) {
      this.ecosystem._scheduler.flush()
    }
  }

  private _invalidate(
    operation = 'invalidate',
    sourceType: EvaluationSourceType = 'External'
  ) {
    this._scheduleEvaluation(
      {
        operation,
        sourceType,
        type: 'cache invalidated',
      },
      false
    )

    // run the scheduler synchronously after invalidation
    this.ecosystem._scheduler.flush()
  }

  private _setStatus(newStatus: LifecycleStatus) {
    const oldStatus = this.status
    this.status = newStatus

    if (this.ecosystem._mods.statusChanged) {
      this.ecosystem.modBus.dispatch(
        pluginActions.statusChanged({
          instance: this,
          newStatus,
          oldStatus,
        })
      )
    }
  }

  private _setPromise(promise: Promise<any>, isStateUpdater?: boolean) {
    if (promise === this.promise) return this.store.getState()

    this.promise = promise as G['Promise']

    // since we're the first to chain off the returned promise, we don't need to
    // track the chained promise - it will run first, before React suspense's
    // `.then` on the thrown promise, for example
    promise
      .then(data => {
        if (this.promise !== promise) return

        this._promiseStatus = 'success'
        if (!isStateUpdater) return

        this.store.setState(
          (getSuccessPromiseState(data) as unknown) as G['State']
        )
      })
      .catch(error => {
        if (this.promise !== promise) return

        this._promiseStatus = 'error'
        this._promiseError = error
        if (!isStateUpdater) return

        this.store.setState(
          (getErrorPromiseState(error) as unknown) as G['State']
        )
      })

    const state: PromiseState<any> = getInitialPromiseState()
    this._promiseStatus = state.status

    this.ecosystem._graph.scheduleDependents(
      this.id,
      this._nextEvaluationReasons,
      undefined,
      undefined,
      true,
      'promise changed',
      'Updated',
      true
    )

    return (state as unknown) as G['State']
  }
}
