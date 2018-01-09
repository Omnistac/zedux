import { compose } from '../../src/index'


describe('compose()', () => {

  test('returns the identity function if nothing is passed', () => {

    const composedFunction = compose()

    expect(composedFunction('a')).toBe('a')
    expect(composedFunction(1, 2, 3)).toBe(1)

  })


  test('throws a TypeError if a non-function is passed', () => {

    expect(compose.bind(null, 'a')).toThrow(TypeError)
    expect(compose.bind(null, {})).toThrow(TypeError)

  })


  test('returns the passed function if only one argument is passed', () => {

    const fn = jest.fn(() => 1)
    const composedFunction = compose(fn)

    expect(composedFunction('a')).toBe(1)
    expect(fn).toHaveBeenLastCalledWith('a')

    composedFunction(1, 2, 3)

    expect(fn).toHaveBeenLastCalledWith(1, 2, 3)

  })


  test('composes the given functions from right-to-left', () => {

    const fn1 = jest.fn(x => x + 2)
    const fn2 = jest.fn(x => x * 2)
    const fn3 = jest.fn(x => x / 2)

    const composedFunction = compose(fn1, fn2, fn3)

    expect(composedFunction(2)).toBe(4)
    expect(fn3).toHaveBeenLastCalledWith(2)
    expect(fn2).toHaveBeenLastCalledWith(1)
    expect(fn1).toHaveBeenLastCalledWith(2)

    const composedFunction2 = compose(fn3, fn1, fn2)

    expect(composedFunction2(2)).toBe(3)
    expect(fn2).toHaveBeenLastCalledWith(2)
    expect(fn1).toHaveBeenLastCalledWith(4)
    expect(fn3).toHaveBeenLastCalledWith(6)

  })

})
