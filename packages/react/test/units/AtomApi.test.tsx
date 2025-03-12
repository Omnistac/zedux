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
})
