import {
  areArgsEqual,
  createSelector,
  memoize
} from '../../src/utils/memoize'


describe('areArgsEqual()', () => {

  test('short-circuits and returns false if oldArgs is null', () => {

    let oldArgs = null

    expect(areArgsEqual(oldArgs)).toBe(false)

  })


  test('short-circuits and returns false if oldArgs and newArgs do not have the same length', () => {

    let oldArgs = []
    let newArgs = [ 1 ]

    oldArgs.every = jest.fn()

    expect(areArgsEqual(oldArgs, newArgs)).toBe(false)
    expect(oldArgs.every).not.toHaveBeenCalled()

  })


  test('returns true only if all arguments are strictly equal', () => {

    let arr = []
    let obj = {}
    let int = 1
    let str = 'a'

    expect(areArgsEqual(
      [ arr ],
      [ [] ]
    )).toBe(false)

    expect(areArgsEqual(
      [ obj ],
      [ {} ]
    )).toBe(false)

    expect(areArgsEqual(
      [ int ],
      [ 1 ]
    )).toBe(true)

    expect(areArgsEqual(
      [ str ],
      [ 'a' ]
    )).toBe(true)

    expect(areArgsEqual(
      [ arr, obj, int, str ],
      [ arr, obj, int, str ]
    )).toBe(true)

    expect(areArgsEqual(
      [ arr, obj, int, str ],
      [ obj, arr, int, str ]
    )).toBe(false)

    expect(areArgsEqual(
      [ 0 ],
      [ '0' ]
    )).toBe(false)

    expect(areArgsEqual(
      [ '0' ],
      [ '0' ]
    )).toBe(true)

  })


  test('returns true if both oldArgs and newArgs are empty', () => {

    expect(areArgsEqual(
      [],
      []
    )).toBe(true)

  })

})


describe('memoize()', () => {

  test('the memoized function calls the stateless function when subsequently invoked with different arguments', () => {

    let statelessFn = jest.fn()
    let memoizedFn = memoize(statelessFn)

    memoizedFn()
    memoizedFn(1)
    memoizedFn('a')

    expect(statelessFn).toHaveBeenCalledTimes(3)
    expect(statelessFn).toHaveBeenCalledWith()
    expect(statelessFn).toHaveBeenCalledWith(1)
    expect(statelessFn).toHaveBeenLastCalledWith('a')

  })


  test('the memoized function does not call the stateless function when subsequently invoked with the same arguments', () => {

    let obj = {}
    let statelessFn = jest.fn()
    let memoizedFn = memoize(statelessFn)

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

    let obj = {}
    let memoizedFn = memoize(
      () => ({}) // return an empty object
    )

    expect(memoizedFn()).toBe(memoizedFn())
    expect(memoizedFn('a', 1, obj)).toBe(memoizedFn('a', 1, obj))
    expect(memoizedFn(obj)).not.toBe(memoizedFn({}))

  })

})


describe('createSelector()', () => {

  test('the dependencies receive the arguments passed to the selector; the calculator receives the result of the dependencies + the original args', () => {

    let calculator = jest.fn()
    let dep1 = jest.fn(() => 'a')
    let dep2 = jest.fn(() => 1)
    let selector = createSelector(calculator, [ dep1, dep2 ])

    selector('b', 2)

    expect(dep1).toHaveBeenCalledWith('b', 2)
    expect(dep2).toHaveBeenCalledWith('b', 2)
    expect(calculator).toHaveBeenCalledWith('a', 1, 'b', 2)

  })

})
