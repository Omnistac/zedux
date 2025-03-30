import {
  api,
  As,
  atom,
  injectAtomValue,
  injectPromise,
  injectRef,
} from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

const reloadAtom = atom('reload', 0)

const promiseAtom = atom('promise', (runOnInvalidate?: boolean) => {
  const countRef = injectRef(0)
  const reloadCounter = injectAtomValue(reloadAtom)

  const atomApi = injectPromise(
    () =>
      new Promise<number>(resolve => {
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
  test('query atoms retain data during reload', async () => {
    jest.useFakeTimers()

    const queryInstance = ecosystem.getInstance(queryAtom)
    const reloadInstance = ecosystem.getInstance(reloadAtom)

    expect(queryInstance.get()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for AtomInstance's `.then` to run

    expect(queryInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    reloadInstance.set(1)

    expect(queryInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for AtomInstance's `.then` to run

    expect(queryInstance.get()).toEqual({
      data: 1,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })
})

describe('injectPromise', () => {
  test('retains data during reload', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getInstance(promiseAtom)
    const reloadInstance = ecosystem.getInstance(reloadAtom)

    expect(promiseInstance.get()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    reloadInstance.set(1)

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 2,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('runOnInvalidate reruns promise factory on atom invalidation', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getNode(promiseAtom, [true])

    expect(promiseInstance.get()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    promiseInstance.invalidate()

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 1,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('does not rerun promise function on atom invalidation when !runOnInvalidate', async () => {
    jest.useFakeTimers()

    const promiseInstance = ecosystem.getInstance(promiseAtom, [false])

    expect(promiseInstance.get()).toEqual({
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    promiseInstance.invalidate()

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })

    jest.runAllTimers()
    await Promise.resolve() // wait for injectPromise's `.then` to run

    expect(promiseInstance.get()).toEqual({
      data: 0,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })

  test('custom events reach the dataSignal and outer observers', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const atomApi = injectPromise(() => Promise.resolve(1), [], {
        events: { test: As<string> },
      })

      return atomApi.setExports({ dataSignal: atomApi.dataSignal })
    })

    const node1 = ecosystem.getNode(atom1)

    node1.on('test', event => {
      expectTypeOf(event).toEqualTypeOf<string>()
      calls.push(['atom', event])
    })

    node1.x.dataSignal.on('test', event => {
      expectTypeOf(event).toEqualTypeOf<string>()
      calls.push(['dataSignal', event])
    })

    node1.send({ test: 'a' })

    expect(calls).toEqual([
      ['dataSignal', 'a'],
      ['atom', 'a'],
    ])
  })

  test('the dataSignal is passed to the promise factory', async () => {
    const atom1 = atom('1', () => {
      return injectPromise(
        async ({
          prevData,
        }: {
          controller?: AbortController
          prevData?: string
        }) => {
          await Promise.resolve(1)

          return prevData ? prevData + 'b' : 'a'
        },
        [],
        { runOnInvalidate: true }
      )
    })

    const node1 = ecosystem.getNode(atom1)
    expect(node1.get().data).toBeUndefined()

    await node1.promise
    expect(node1.get().data).toBe('a')

    node1.invalidate()
    expect(node1.get().data).toBe('a')

    await node1.promise
    expect(node1.get().data).toBe('ab')
  })

  test('The AbortController aborts on rerun', async () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      return injectPromise(
        async ({ controller }) => {
          if (controller) {
            controller.signal.onabort = () => {
              calls.push('aborted')
            }
          }

          calls.push('awaiting')
          await Promise.resolve(1)
          calls.push('resolved')

          return 'a'
        },
        [],
        { runOnInvalidate: true }
      )
    })

    const node1 = ecosystem.getNode(atom1)

    expect(calls).toEqual(['awaiting'])

    await node1.promise

    expect(calls).toEqual(['awaiting', 'resolved'])

    node1.invalidate()

    expect(calls).toEqual(['awaiting', 'resolved', 'awaiting', 'aborted'])
  })

  test('abort is aborted if the promise factory returns the same promise reference', async () => {
    const calls: any[] = []
    const promise = Promise.resolve('a')

    const atom1 = atom('1', () => {
      return injectPromise(
        ({ controller }) => {
          if (controller) {
            controller.signal.onabort = () => {
              calls.push('aborted')
            }
          }

          calls.push('awaiting')

          return promise
        },
        [],
        { runOnInvalidate: true }
      )
    })

    const node1 = ecosystem.getNode(atom1)
    await node1.promise

    expect(calls).toEqual(['awaiting'])

    node1.invalidate()

    expect(calls).toEqual(['awaiting', 'awaiting'])
  })
})
