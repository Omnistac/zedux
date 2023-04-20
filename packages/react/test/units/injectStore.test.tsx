import { atom, injectStore } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

describe('injectStore()', () => {
  test('subscribe: false prevents subscription', () => {
    let evaluations = 0

    const atom1 = atom('1', () => {
      const store = injectStore('a', { subscribe: false })

      evaluations++

      return store
    })

    const instance1 = ecosystem.getInstance(atom1)

    expect(evaluations).toBe(1)
    expect(instance1.getState()).toBe('a')

    instance1.setState('b')

    expect(evaluations).toBe(1)
    expect(instance1.getState()).toBe('b')
  })

  test('unrecognized meta types are ignored', () => {
    const evaluations: string[] = []

    const atom1 = atom('1', () => {
      const store = injectStore('a')

      evaluations.push(store.getState())

      return store
    })

    const instance1 = ecosystem.getInstance(atom1)

    expect(evaluations).toEqual(['a'])
    expect(instance1.getState()).toBe('a')

    instance1.setState('b', 'test-meta-type')

    expect(evaluations).toEqual(['a', 'b'])
    expect(instance1.getState()).toBe('b')
  })
})
