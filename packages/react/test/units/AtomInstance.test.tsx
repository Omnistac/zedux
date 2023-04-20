import { atom, createStore, injectEffect, injectStore } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { mockConsole } from '../utils/console'

describe('AtomInstance', () => {
  test("an instance's state can be a function", () => {
    const atom1 = atom('1', () => (param: string) => param + 1)

    const instance = ecosystem.getInstance(atom1)
    const getVal = instance.getState()

    expect(getVal('a')).toBe('a1')

    instance.invalidate()
    const getVal2 = instance.getState()

    expect(getVal2).not.toBe(getVal)
    expect(getVal2('a')).toBe('a1')
  })

  test('atom instances have to return the same state type on every evaluation', () => {
    let evaluations = 0
    const atom1 = atom('1', () => {
      const store = injectStore()
      evaluations++

      return evaluations % 2 ? store : evaluations
    })

    const instance = ecosystem.getInstance(atom1)

    expect(() => instance.invalidate()).toThrowError(
      /returned a different type/i
    )
  })

  test('atom instances have to return the same store on every evaluation', () => {
    const atom1 = atom('1', () => createStore(null, 1))

    const instance = ecosystem.getInstance(atom1)

    expect(() => instance.invalidate()).toThrowError(
      /returned a different store/i
    )
  })

  test('errors thrown during evaluation are rethrown', () => {
    const mock = mockConsole('error')

    const atom1 = atom('1', () => {
      throw 'test'
    })

    expect(() => ecosystem.getInstance(atom1)).toThrowError('test')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringMatching(/error while evaluating atom/i),
      [],
      'test'
    )
  })

  test('injectors are cleaned up if an error is thrown during the same evaluation', () => {
    const mock = mockConsole('error')
    const cleanup = jest.fn()

    const atom1 = atom('1', () => {
      injectEffect(() => cleanup, [], { synchronous: true })
      throw 'test'
    })

    expect(() => ecosystem.getInstance(atom1)).toThrowError('test')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringMatching(/error while evaluating atom/i),
      [],
      'test'
    )
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  test('setStateDeep() is an alias for `store.setStateDeep()`', () => {
    const atom1 = atom('1', { a: 1, b: { c: 3 } })

    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.getState()).toEqual({ a: 1, b: { c: 3 } })

    instance1.setStateDeep({ b: { c: 33 } })

    expect(instance1.getState()).toEqual({ a: 1, b: { c: 33 } })

    instance1.setStateDeep(state => ({ b: { c: state.b.c - 1 } }))

    expect(instance1.getState()).toEqual({ a: 1, b: { c: 32 } })
  })
})
