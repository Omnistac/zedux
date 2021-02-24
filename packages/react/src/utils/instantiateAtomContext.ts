import { EffectsSubscriber, Subscriber } from '@zedux/core'
import { useEffect, useState as useStateReact } from 'react'
import { injectEffect } from '../injectors'
import { AtomContext, AtomContextInstance } from '../types'
import { diContext } from './csContexts'
import { EvaluationTargetType, EvaluationType } from './types'

export const instantiateAtomContext = <T = any>(
  atomContext: AtomContext<T>,
  initialState?: T
) => {
  const store = atomContext.storeFactory(initialState)

  const injectDispatch = () => store.dispatch

  const injectSelector = <D = any>(selector: (state: T) => D) => {
    const { scheduleEvaluation } = diContext.consume()

    injectEffect(() => {
      let prevResult: D
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState) return

        const newResult = selector(newState)

        if (newResult === prevResult) return

        prevResult = newResult

        scheduleEvaluation({
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

  const injectSetState = () => store.setState

  const injectState = () => {
    const { scheduleEvaluation } = diContext.consume()

    injectEffect(() => {
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState) return

        scheduleEvaluation({
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

  const injectStore = () => store

  const injectValue = () => {
    const { scheduleEvaluation } = diContext.consume()

    injectEffect(() => {
      const subscriber: EffectsSubscriber<T> = ({
        action,
        newState,
        oldState,
      }) => {
        if (newState === oldState) return

        scheduleEvaluation({
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

  const useDispatch = () => store.dispatch

  const useSelector = <D = any>(selector: (state: T) => D) => {
    const [state, setState] = useStateReact(selector(store.getState()))

    useEffect(() => {
      let prevResult: D
      const subscriber: Subscriber<T> = newState => {
        const newResult = selector(newState)

        if (newResult === prevResult) return

        prevResult = newResult

        setState(newResult)
      }

      const subscription = store.subscribe(subscriber)

      return () => subscription.unsubscribe()
    }, [])

    return state
  }

  const useSetState = () => store.setState

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

  const useStore = () => store

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
    injectDispatch,
    injectSelector,
    injectSetState,
    injectState,
    injectStore,
    injectValue,
    useDispatch,
    useSelector,
    useSetState,
    useState,
    useStore,
    useValue,
  }

  return newInstance
}
