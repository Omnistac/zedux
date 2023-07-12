import {
  api,
  atom,
  injectAtomValue,
  injectPromise,
  injectRef,
} from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

const reloadAtom = atom('reload', 0)

const promiseAtom = atom('promise', (runOnInvalidate?: boolean) => {
  const countRef = injectRef(0)
  const reloadCounter = injectAtomValue(reloadAtom)

  const atomApi = injectPromise(
    () =>
      new Promise(resolve => {
        setTimeout(() => resolve(reloadCounter + countRef.current++), 1)
      }),
    [reloadCounter],
    { runOnInvalidate }
  )

  return atomApi
})

const queryAtom = atom('query', () => {
  const reloadCounter = injectAtomValue(reloadAtom)

  return api(
    new Promise(resolve => {
      setTimeout(() => resolve(reloadCounter), 1)
    })
  )
})

describe('promises', () => {
  test('injectPromise retains data during reload', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getInstance(promiseAtom)
    const reloadInstance = ecosystem.getInstance(reloadAtom)

    expect(promiseInstance.getState()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    reloadInstance.setState(1)

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 2,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('query atoms retain data during reload', async () => {
    jest.useFakeTimers()

    const queryInstance = ecosystem.getInstance(queryAtom)
    const reloadInstance = ecosystem.getInstance(reloadAtom)

    expect(queryInstance.getState()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for AtomInstance's `.then` to run

    expect(queryInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    reloadInstance.setState(1)

    expect(queryInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for AtomInstance's `.then` to run

    expect(queryInstance.getState()).toEqual({
      data: 1,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('injectPromise runOnInvalidate reruns promise factory on atom invalidation', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getInstance(promiseAtom, [true])

    expect(promiseInstance.getState()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    promiseInstance.invalidate()

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 1,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('injectPromise does not rerun promise function on atom invalidation when !runOnInvalidate', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getInstance(promiseAtom, [false])

    expect(promiseInstance.getState()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    promiseInstance.invalidate()

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.getState()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })
})
