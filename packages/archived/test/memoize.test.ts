import { areArgsEqual, memoize } from '../src/memoize'
import { createSelector } from '../src/createSelector'

describe('areArgsEqual()', () => {
  test('short-circuits and returns false if oldArgs is null', () => {
    expect(areArgsEqual([], null)).toBe(false)
  })

  test('short-circuits and returns false if oldArgs and newArgs do not have the same length', () => {
    const oldArgs: any[] = []
    const newArgs = [1]

    oldArgs.every = jest.fn()

    expect(areArgsEqual(newArgs, oldArgs)).toBe(false)
    expect(oldArgs.every).not.toHaveBeenCalled()
  })

  test('returns true only if all arguments are strictly equal', () => {
    const arr: any[] = []
    const obj = {}
    const int = 1
    const str = 'a'

    expect(areArgsEqual([[]], [arr])).toBe(false)

    expect(areArgsEqual([{}], [obj])).toBe(false)

    expect(areArgsEqual([1], [int])).toBe(true)

    expect(areArgsEqual(['a'], [str])).toBe(true)

    expect(areArgsEqual([arr, obj, int, str], [arr, obj, int, str])).toBe(true)

    expect(areArgsEqual([obj, arr, int, str], [arr, obj, int, str])).toBe(false)

    expect(areArgsEqual(['0'], [0])).toBe(false)

    expect(areArgsEqual(['0'], ['0'])).toBe(true)
  })

  test('returns true if both oldArgs and newArgs are empty', () => {
    expect(areArgsEqual([], [])).toBe(true)
  })
})

describe('memoize()', () => {
  test('the memoized function calls the stateless function when subsequently invoked with different arguments', () => {
    const statelessFn = jest.fn()
    const memoizedFn = memoize(statelessFn)

    memoizedFn()
    memoizedFn(1)
    memoizedFn('a')

    expect(statelessFn).toHaveBeenCalledTimes(3)
    expect(statelessFn).toHaveBeenCalledWith()
    expect(statelessFn).toHaveBeenCalledWith(1)
    expect(statelessFn).toHaveBeenLastCalledWith('a')
  })

  test('the memoized function does not call the stateless function when subsequently invoked with the same arguments', () => {
    const obj = {}
    const statelessFn = jest.fn()
    const memoizedFn = memoize(statelessFn)

    memoizedFn()
    memoizedFn()
    memoizedFn('a')
    memoizedFn('a')
    memoizedFn({}, obj)
    memoizedFn({}, obj) // should trigger a re-calculation
    memoizedFn(obj, obj, obj)
    memoizedFn(obj, obj, obj)

    expect(statelessFn).toHaveBeenCalledTimes(5)
    expect(statelessFn).toHaveBeenCalledWith()
    expect(statelessFn).toHaveBeenCalledWith('a')
    expect(statelessFn).toHaveBeenCalledWith({}, obj)
    expect(statelessFn).toHaveBeenLastCalledWith(obj, obj, obj)
  })

  test('the memoized function returns the exact (===) same value when subsequently invoked with the same arguments', () => {
    const obj = {}
    const memoizedFn = memoize(
      () => ({}) // return an empty object
    )

    expect(memoizedFn()).toBe(memoizedFn())
    expect(memoizedFn('a', 1, obj)).toBe(memoizedFn('a', 1, obj))
    expect(memoizedFn(obj)).not.toBe(memoizedFn({}))
  })
})

describe('createSelector()', () => {
  test('the input selectors receive the arguments passed to the selector; the calculator receives the output of the input selectors', () => {
    const calculator = jest.fn()
    const dep1 = jest.fn(() => 'a')
    const dep2 = jest.fn(() => 1)
    const selector = createSelector(dep1, dep2, calculator)

    selector('b', 2)

    expect(dep1).toHaveBeenCalledWith('b', 2)
    expect(dep2).toHaveBeenCalledWith('b', 2)
    expect(calculator).toHaveBeenCalledWith('a', 1)
  })

  test('does not call the calculator function if the state has not changed', () => {
    const calculator = jest.fn()
    const selector = createSelector(calculator)

    selector('a')
    selector('a')

    expect(calculator).toHaveBeenCalledTimes(1)
    expect(calculator).toHaveBeenLastCalledWith('a')

    selector('b')

    expect(calculator).toHaveBeenCalledTimes(2)
    expect(calculator).toHaveBeenLastCalledWith('b')
  })

  test('does not call the calculator function if the output of the input selectors has not changed', () => {
    const calculator = jest.fn()
    const dep1 = jest.fn(() => 'a')
    const selector = createSelector(dep1, calculator)

    selector('a')
    selector('b')

    expect(calculator).toHaveBeenCalledTimes(1)
    expect(calculator).toHaveBeenLastCalledWith('a')
  })
})
