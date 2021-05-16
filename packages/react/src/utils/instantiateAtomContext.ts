import { EffectsSubscriber, Subscriber } from '@zedux/core'
import { useEffect, useRef, useState as useStateReact } from 'react'
import { injectEffect, injectRef } from '../injectors'
import { AtomContext, AtomContextInstance } from '../types'
import { diContext } from './csContexts'
import { EvaluationTargetType, EvaluationType } from './types'

export const instantiateAtomContext = <T = any>(
  atomContext: AtomContext<T>,
  initialState?: T
) => {
  const store = atomContext.storeFactory(initialState)

  const injectSelector = <D = any>(selector: (state: T) => D) => {
    const { instance } = diContext.consume()
    const selectorRef = injectRef(selector)
    selectorRef.current = selector

    injectEffect(() => {
      let prevResult: D
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState || !selectorRef.current) return

        const newResult = selectorRef.current(newState)

        if (newResult === prevResult) return

        prevResult = newResult

        instance._scheduleEvaluation({
          action,
          newState,
          oldState,
          operation: 'injectSelector()',
          targetType: EvaluationTargetType.AtomContext,
          type: EvaluationType.StateChanged,
        })
      }

      const subscription = store.subscribe({ effects: subscriber })

      return () => subscription.unsubscribe()
    }, [])

    // I think this is fine:
    return selector(store.getState())
  }

  const injectState = () => {
    const { instance } = diContext.consume()

    injectEffect(() => {
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState) return

        instance._scheduleEvaluation({
          action,
          newState,
          oldState,
          operation: 'injectState()',
          targetType: EvaluationTargetType.AtomContext,
          type: EvaluationType.StateChanged,
        })
      }

      const subscription = store.subscribe({ effects: subscriber })

      return () => subscription.unsubscribe()
    }, [])

    // I think this is fine:
    return [store.getState(), store.setState] as const
  }

  const injectValue = () => {
    const { instance } = diContext.consume()

    injectEffect(() => {
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState) return

        instance._scheduleEvaluation({
          action,
          newState,
          oldState,
          operation: 'injectValue()',
          targetType: EvaluationTargetType.AtomContext,
          type: EvaluationType.StateChanged,
        })
      }

      const subscription = store.subscribe({ effects: subscriber })

      return () => subscription.unsubscribe()
    }, [])

    // I think this is fine:
    return store.getState()
  }

  const useSelector = <D = any>(selector: (state: T) => D) => {
    const [state, setState] = useStateReact(selector(store.getState()))
    const selectorRef = useRef(selector)
    selectorRef.current = selector

    useEffect(() => {
      let prevResult: D
      const subscriber: Subscriber<T> = newState => {
        const newResult = selectorRef.current(newState)

        if (newResult === prevResult) return

        prevResult = newResult

        setState(newResult)
      }

      const subscription = store.subscribe(subscriber)

      return () => subscription.unsubscribe()
    }, [])

    return state
  }

  const useState = () => {
    const [state, setState] = useStateReact(store.getState())

    useEffect(() => {
      const subscriber: Subscriber<T> = newState => {
        setState(newState)
      }

      const subscription = store.subscribe(subscriber)

      return () => subscription.unsubscribe()
    }, [])

    return [state, store.setState] as const
  }

  const useValue = () => {
    const [state, setState] = useStateReact(store.getState())

    useEffect(() => {
      const subscriber: Subscriber<T> = newState => {
        setState(newState)
      }

      const subscription = store.subscribe(subscriber)

      return () => subscription.unsubscribe()
    }, [])

    return state
  }

  const newInstance: AtomContextInstance<T> = {
    atomContext,
    injectSelector,
    injectState,
    injectValue,
    store,
    useSelector,
    useState,
    useValue,
  }

  return newInstance
}
