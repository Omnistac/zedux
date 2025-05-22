import { api, atom } from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'

describe('AtomApi', () => {
  test('exports are not wrapped when set outside an atom', () => {
    const fn = () => {}
    const testApi = api().setExports({ fn })

    expect(testApi.exports?.fn).toBe(fn)
  })

  test('wrapped exports have the same name as the wrapped function', () => {
    const fn = () => {}
    const atom1 = atom('1', () => api().setExports({ fn }))
    const node1 = ecosystem.getNode(atom1)

    expect(node1.exports.fn).not.toBe(fn)
    expect(node1.exports.fn.name).toBe('fn')
  })

  test('passing an api to api() clones it', () => {
    const promise = Promise.resolve(1)
    const api1 = api(1).setExports({ b: 2 }).setPromise(promise).setTtl(1000)
    const api2 = api(api1)

    expect(api1).not.toBe(api2)
    expect(api1.exports).toEqual({ b: 2 })
    expect(api1.promise).toBe(promise)
    expect(api1.signal).toBe(undefined)
    expect(api1.value).toBe(1)
    expect(api1.ttl).toBe(1000)
    expect(api2.exports).toEqual({ b: 2 })
    expect(api2.promise).toBe(promise)
    expect(api2.signal).toBe(undefined)
    expect(api2.value).toBe(1)
    expect(api2.ttl).toBe(1000)
  })

  test('functions with static properties are not wrapped', () => {
    const atom1 = atom('1', () => {
      const fn = () => {}
      fn.staticProp = 1

      return api().setExports({ fn })
    })

    const node1 = ecosystem.getNode(atom1)
    const { fn } = node1.exports

    expect(fn.staticProp).toBe(1)
  })

  test('classes themselves are not wrapped', () => {
    const atom1 = atom('1', () => {
      class Test {
        prop = 1
      }

      return api().setExports({ Test })
    })

    const node1 = ecosystem.getNode(atom1)
    const { Test } = node1.exports

    expect(new Test().prop).toBe(1)
  })
})
