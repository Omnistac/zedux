import { EffectsSubscriber, Subscriber } from '@zedux/core'
import { injectEffect, injectRef } from '@zedux/react/injectors'
import {
  ActiveState,
  AtomInstance,
  AtomValue,
  ReadonlyAtom,
  ReadonlyAtomInstance,
  ReadonlyLocalAtom,
} from '@zedux/react/types'
import {
  EvaluationTargetType,
  EvaluationType,
  ExportsInjectorDescriptor,
  InjectorDescriptor,
  InjectorType,
} from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/csContexts'
import React, { FC, useEffect, useRef, useState } from 'react'
import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

const getExports = <Exports extends Record<string, any>>(
  injectors: InjectorDescriptor[]
) =>
  (injectors.find(injector => injector.type === InjectorType.Exports) as
    | ExportsInjectorDescriptor<Exports>
    | undefined)?.exports

export const createStandardAtomInstance = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  ecosystemId: string,
  atom: ReadonlyAtom<State, Params, Exports>,
  keyHash: string,
  params: Params
) => {
  const scheduleDestruction = () => {
    const { ttl } = atom as any

    // By default, atoms live forever.
    if (
      ttl == null ||
      newAtomInstance.internals.activeState === ActiveState.Destroyed
    ) {
      return
    }

    if (ttl === 0) {
      return newAtomInstance.internals.destroy()
    }

    // schedule destruction (if ttl is > 0)
    if (typeof ttl === 'number') {
      if (newAtomInstance.internals.destructionTimeout) {
        clearTimeout(newAtomInstance.internals.destructionTimeout)
      }

      const timeoutId = setTimeout(
        () => newAtomInstance.internals.destroy(),
        ttl
      )
      // TODO: dispatch an action over stateStore for these mutations
      newAtomInstance.internals.destructionTimeout = timeoutId
      newAtomInstance.internals.activeState = ActiveState.Destroying
    }
  }

  const newAtomInstance: ReadonlyAtomInstance<
    State,
    Params,
    Exports
  > = createStandardAtomInstanceWithDestruction(
    ecosystemId,
    atom,
    keyHash,
    params,
    scheduleDestruction
  )

  return newAtomInstance
}

export const createStandardAtomInstanceWithDestruction = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  ecosystemId: string,
  atom:
    | ReadonlyLocalAtom<State, Params, Exports>
    | ReadonlyAtom<State, Params, Exports>,
  keyHash: string,
  params: Params,
  scheduleDestruction: () => void = () => internals.destroy()
) => {
  const evaluate = () => {
    const { value } = atom

    if (typeof value !== 'function') {
      return value
    }

    try {
      return (value as (...params: Params) => AtomValue<State>)(...params)
    } catch (err) {
      console.error(
        `Zedux - Error while instantiating atom "${atom.key}" with params:`,
        params,
        err
      )

      throw err
    }
  }

  const internals = createAtomInstanceInternals(
    ecosystemId,
    atom,
    keyHash,
    params,
    evaluate,
    scheduleDestruction
  )

  const injectSelector = <D extends any = any>(
    selector: (state: State) => D
  ) => {
    const { scheduleEvaluation } = diContext.consume()
    const selectorRef = injectRef(selector)
    selectorRef.current = selector

    injectEffect(() => {
      let prevResult: D

      const subscriber: EffectsSubscriber<State> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState || !selectorRef.current) return

        const newResult = selectorRef.current(newState)
        if (newResult === prevResult) return

        prevResult = newResult

        scheduleEvaluation({
          action,
          newState,
          oldState,
          operation: 'injectSelector()',
          targetType: EvaluationTargetType.Atom,
          type: EvaluationType.StateChanged,
        })
      }

      const subscription = internals.stateStore.subscribe({
        effects: subscriber,
      })

      return () => subscription.unsubscribe()
    }, [])

    // I think this is fine (for now):
    return selector(internals.stateStore.getState())
  }

  const injectValue = () => {
    injectEffect(() => {
      const subscription = internals.stateStore.subscribe(
        (newState, oldState) => {
          internals.scheduleEvaluation({
            newState,
            oldState,
            operation: 'injectValue()',
            targetType: EvaluationTargetType.Atom,
            type: EvaluationType.StateChanged,
          })
        }
      )

      return () => subscription.unsubscribe()
    }, [])

    return internals.stateStore.getState()
  }

  const invalidate = () => {
    internals.scheduleEvaluation({
      operation: 'invalidate()',
      targetType: EvaluationTargetType.External,
      type: EvaluationType.CacheInvalidated,
    })
  }

  const Provider: FC = ({ children }) => {
    const context = atom.getReactContext()

    return (
      <context.Provider value={newAtomInstance as any}>
        {children}
      </context.Provider>
    )
  }

  const useSelector = <D extends any = any>(selector: (state: State) => D) => {
    const [state, setState] = useState(
      selector(internals.stateStore.getState())
    )
    const selectorRef = useRef(selector)
    selectorRef.current = selector

    useEffect(() => {
      let prevResult: D
      const subscriber: Subscriber<State> = newState => {
        const newResult = selectorRef.current(newState)

        if (newResult === prevResult) return

        prevResult = newResult

        setState(newResult)
      }

      const subscription = internals.stateStore.subscribe(subscriber)

      return () => subscription.unsubscribe()
    }, [])

    return state
  }

  const useValue = () => {
    const [state, setState] = useState(internals.stateStore.getState())

    useEffect(() => {
      const subscription = internals.stateStore.subscribe(val => setState(val))

      return () => subscription.unsubscribe()
    })

    return state
  }

  const newAtomInstance: ReadonlyAtomInstance<State, Params, Exports> = {
    exports: getExports<Exports>(internals.injectors) || ({} as any),
    injectSelector,
    injectValue,
    internals,
    invalidate,
    Provider,
    useSelector,
    useValue,
  }

  if (atom.readonly) return newAtomInstance

  const mutableAtomInstance = newAtomInstance as AtomInstance<
    State,
    Params,
    Exports
  >

  mutableAtomInstance.dispatch = internals.stateStore.dispatch

  mutableAtomInstance.injectState = () => {
    injectEffect(() => {
      const subscription = internals.stateStore.subscribe(
        (newState, oldState) => {
          internals.scheduleEvaluation({
            newState,
            oldState,
            operation: 'injectState()',
            targetType: EvaluationTargetType.Atom,
            type: EvaluationType.StateChanged,
          })
        }
      )

      return () => subscription.unsubscribe()
    }, [])

    return [
      internals.stateStore.getState(),
      internals.stateStore.setState,
      internals.stateStore,
    ] as const
  }

  mutableAtomInstance.useState = () => {
    const [state, setState] = useState(internals.stateStore.getState())

    useEffect(() => {
      const subscription = internals.stateStore.subscribe(val => setState(val))

      return () => subscription.unsubscribe()
    })

    return [state, internals.stateStore.setState] as const
  }

  mutableAtomInstance.setState = internals.stateStore.setState
  mutableAtomInstance.store = internals.stateStore

  return newAtomInstance
}
