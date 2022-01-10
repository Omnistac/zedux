import { AsyncEffectCallback, Cleanup } from '../types'
import {
  AsyncEffectInjectorDescriptor,
  haveDepsChanged,
  InjectorType,
  JobType,
  split,
} from '../utils'
import { asyncUtils } from '../utils/asyncUtils'
import { injectAtomGetters } from './injectAtomGetters'

const getTask = <T>(
  callback: AsyncEffectCallback,
  descriptor: AsyncEffectInjectorDescriptor<T>
) => {
  const cleanupFns: Cleanup[] = []
  let isCleanedUp = false

  const task = () => {
    descriptor.asyncStore.dispatch(asyncUtils.actions.load())

    const promise = callback(destructor => {
      if (isCleanedUp) return destructor()

      cleanupFns.push(destructor)
    })

    if (promise && typeof promise.then === 'function') {
      promise
        .then(val => {
          if (isCleanedUp) return

          // calling resolve/reject again does nothing
          descriptor.resolveRef?.(val)
          descriptor.asyncStore.dispatch(asyncUtils.actions.loadSuccess(val))
        })
        .catch(err => {
          if (isCleanedUp) return

          // calling resolve/reject again does nothing
          descriptor.rejectRef?.(err)
          descriptor.asyncStore.dispatch(asyncUtils.actions.loadError(err))
        })
    }

    // the task is running now; no need to unschedule it. Overwrite the
    // descriptor's cleanupTask function
    descriptor.cleanupTask = () => {
      cleanupFns.forEach(destructor => destructor())

      isCleanedUp = true
      descriptor.cleanupTask = undefined
    }
  }

  return task
}

export const injectAsyncEffect = <T>(
  callback: AsyncEffectCallback<T>,
  deps?: any[]
) => {
  const { ecosystem } = injectAtomGetters()

  const descriptor = split<AsyncEffectInjectorDescriptor<T>>(
    'injectAsyncEffect',
    InjectorType.AsyncEffect,
    () => {
      const asyncStore = asyncUtils.createAsyncStore<T>()

      const subscription = asyncStore.subscribe({
        effects: ({ action }) => {
          if (action?.type === asyncUtils.actions.cancel.type) {
            descriptor.cleanupTask?.()
          }
        },
      })

      const descriptor: Partial<AsyncEffectInjectorDescriptor<T>> = {
        cleanup: () => {
          descriptor.cleanupTask?.()
          subscription.unsubscribe()
        },
        deps,
        asyncStore,
        subscription,
        type: InjectorType.AsyncEffect,
      }
      descriptor.promise = new Promise((resolve, reject) => {
        descriptor.resolveRef = resolve
        descriptor.rejectRef = reject
      })

      const task = getTask(
        callback,
        descriptor as AsyncEffectInjectorDescriptor<T>
      )

      descriptor.cleanupTask = () => {
        ecosystem._scheduler.unscheduleJob(task)
        descriptor.cleanupTask = undefined
      }

      ecosystem._scheduler.scheduleJob({
        task,
        type: JobType.RunEffect,
      })

      return descriptor as AsyncEffectInjectorDescriptor<T>
    },
    prevDescriptor => {
      const depsHaveChanged = haveDepsChanged(prevDescriptor.deps, deps)

      if (!depsHaveChanged) return prevDescriptor

      prevDescriptor.cleanupTask?.()

      const task = getTask(callback, prevDescriptor)
      prevDescriptor.cleanupTask = () => {
        ecosystem._scheduler.unscheduleJob(task)
        prevDescriptor.cleanupTask = undefined
      }
      prevDescriptor.deps = deps

      ecosystem._scheduler.scheduleJob({
        task,
        type: JobType.RunEffect,
      })

      return prevDescriptor
    }
  )

  return [descriptor.promise, descriptor.asyncStore] as const
}
