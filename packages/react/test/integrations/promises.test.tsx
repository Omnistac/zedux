import { atom, injectAtomValue, injectPromise } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

const reloadAtom = atom('reload', 0)

const promiseAtom = atom('promise', () => {
  const reloadCounter = injectAtomValue(reloadAtom)

  const atomApi = injectPromise(
    () =>
      new Promise(resolve => {
        setTimeout(() => resolve(reloadCounter), 1)
      }),
    [reloadCounter]
  )

  return atomApi
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
    await Promise.resolve() // wait for injectPromise's .then to run

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
    await Promise.resolve() // wait for injectPromise's .then to run

    expect(promiseInstance.getState()).toEqual({
      data: 1,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
    })
  })
})
