import { select } from '../../src/index'
import { nonPlainObjects } from '../utils'


describe('Zedux.select()', () => {

  test('throws a TypeError if not all arguments are functions', () => {

    nonPlainObjects.forEach(nonPlainObject => {
      if (typeof nonPlainObject === 'function') return

      expect(select.bind(null, nonPlainObject)).toThrow(TypeError)
    })

    expect(select.bind(null, () => {}, () => {}, () => {})).not.toThrow()

    expect(select.bind(null, () => {}, () => {}, () => {}, 'a')).toThrow(TypeError)

  })


  test('returns a selector with no dependencies if one function is passed', () => {

    const calculator = jest.fn()
    const selector = select(calculator)

    selector('a', 1)

    expect(calculator).toHaveBeenLastCalledWith('a', 1)

  })


  test('returns a selector whose dependencies are all input parameters but the last', () => {

    const selector1 = jest.fn(() => 'a')
    const selector2 = jest.fn(() => 1)
    const calculator = jest.fn()
    const memoizedSelector1 = select(selector1, calculator)
    const memoizedSelector2 = select(selector1, selector2, calculator)

    memoizedSelector1('b', 2)

    expect(selector1).toHaveBeenLastCalledWith('b', 2)
    expect(calculator).toHaveBeenLastCalledWith('a', 'b', 2)

    memoizedSelector2('c', 3)

    expect(selector1).toHaveBeenLastCalledWith('c', 3)
    expect(selector2).toHaveBeenLastCalledWith('c', 3)
    expect(calculator).toHaveBeenLastCalledWith('a', 1, 'c', 3)

  })

})
