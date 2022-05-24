import { api } from '../factories'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '../utils/promiseUtils'
import { InjectorDeps } from '../types'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'
import { injectStore } from './injectStore'
import { injectRef } from './injectRef'
import { detailedTypeof } from '@zedux/core/utils/general'

export const injectPromise = <T>(
  getPromise: (controller?: AbortController) => Promise<T>,
  deps?: InjectorDeps
) => {
  const controller = injectMemo(
    () =>
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined,
    []
  )
  const promiseRef = injectRef<Promise<T>>()

  const store = injectStore(getInitialPromiseState<T>())

  // setting a ref during evaluation is perfectly fine in Zedux
  promiseRef.current = injectMemo(() => {
    const promise = getPromise(controller)

    if (DEV && typeof promise?.then !== 'function') {
      throw new TypeError(
        `Zedux: injectPromise expected callback to return a promise. Received ${detailedTypeof(
          promise
        )}`
      )
    }

    if (promise === promiseRef.current) return promiseRef.current

    store.setState(getInitialPromiseState())

    promise
      .then(data => {
        if (promiseRef.current !== promise) return

        store.setState(getSuccessPromiseState(data))
      })
      .catch(error => {
        if (promiseRef.current !== promise) return

        store.setState(getErrorPromiseState(error))
      })

    return promise
  }, deps)

  injectEffect(
    () => () => (controller?.abort as any)?.('atom instance destroyed'),
    []
  )

  return api(store).setPromise(promiseRef.current)
}
