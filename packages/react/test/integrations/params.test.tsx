import { AtomGetters, atom, createEcosystem } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'

describe('params', () => {
  test('deeply nested params are stringified correctly', () => {
    const atom1 = atom(
      '1',
      (param: { a: { b: string[] }; c: { d: { e: symbol } } }) => param.c.d.e
    )

    const params = { a: { b: ['1', '2'] }, c: { d: { e: Symbol.for('test') } } }
    const instance1 = ecosystem.getInstance(atom1, [params])

    expect(instance1.params).toHaveLength(1)
    expect(instance1.params[0]).toBe(params)
    expect(instance1.id).toBe('1-[{"a":{"b":["1","2"]},"c":{"d":{}}}]')
  })

  test('complexParams allows atom and selector params to be functions', () => {
    const atom1 = atom('1', (fn: (val: number) => string) => fn(1))

    const selector1 = ({ get }: AtomGetters, fn: (val: string) => number) =>
      fn(get(atom1, [num => num.toString()]))

    const selector2 = ({ get }: AtomGetters, fn: (val: string) => number) =>
      fn(get(atom1, [num => num.toString()]) + '2')

    const complexEcosystem = createEcosystem({ complexParams: true })

    const reusedFn = (str: string) => Number(str)
    const value1 = complexEcosystem.getNode(selector1, [reusedFn])

    const nodes = [...complexEcosystem.n.keys()]
    const [instanceKey] = nodes.filter(id => !id.startsWith('@selector'))
    const [selectorKey] = nodes.filter(id => id.startsWith('@selector'))

    expect(value1.v).toBe(1)
    expect(instanceKey).toMatch(/^1-\["@ref\(unknown\)-/)
    expect(selectorKey).toMatch(
      /^@selector\(selector1\)-.*?-\["@ref\(reusedFn\)-/
    )

    const value2 = complexEcosystem.getNode(selector2, [reusedFn])

    const nodes2 = [...complexEcosystem.n.keys()]
    const [instanceKey1, instanceKey2] = nodes2.filter(
      id => !id.startsWith('@selector')
    )
    const [selectorKey1, selectorKey2] = nodes2.filter(id =>
      id.startsWith('@selector')
    )

    expect(value2.v).toBe(12)
    expect(instanceKey1).toMatch(/^1-\["@ref\(unknown\)-/)
    expect(instanceKey2).toMatch(/^1-\["@ref\(unknown\)-/)

    // the instances received different function references
    expect(instanceKey1).not.toBe(instanceKey2)

    expect(selectorKey1).toMatch(
      /^@selector\(selector1\)-.*?-\["@ref\(reusedFn\)-/
    )
    expect(selectorKey2).toMatch(
      /^@selector\(selector2\)-.*?-\["@ref\(reusedFn\)-/
    )

    // the selectors received the same function reference
    expect(selectorKey1.slice(28)).toBe(selectorKey2.slice(28))

    complexEcosystem.reset()
  })

  test('complexParams allows atom and selector params to be class instances', () => {
    class Converter {
      toNumber(str: string) {
        return Number(str)
      }
      toString(num: number) {
        return num.toString()
      }
    }

    const atom1 = atom('1', (converter: Converter) => converter.toString(1))

    const selector1 = ({ get }: AtomGetters, converter: Converter) =>
      converter.toNumber(get(atom1, [new (class extends Converter {})()]))

    const selector2 = ({ get }: AtomGetters, converter: Converter) =>
      converter.toNumber(get(atom1, [new (class extends Converter {})()]) + '2')

    const complexEcosystem = createEcosystem({ complexParams: true })

    const reusedInstance = new Converter()
    const value1 = complexEcosystem.getNode(selector1, [reusedInstance])

    const nodes = [...complexEcosystem.n.keys()]
    const [instanceKey] = nodes.filter(id => !id.startsWith('@selector'))
    const [selectorKey] = nodes.filter(id => id.startsWith('@selector'))

    expect(value1.v).toBe(1)
    expect(instanceKey).toMatch(/^1-\["@ref\(unknown\)-/)
    expect(selectorKey).toMatch(
      /^@selector\(selector1\)-.*?-\["@ref\(Converter\)-/
    )

    const value2 = complexEcosystem.getNode(selector2, [reusedInstance])

    const nodes2 = [...complexEcosystem.n.keys()]
    const [instanceKey1, instanceKey2] = nodes2.filter(
      id => !id.startsWith('@selector')
    )
    const [selectorKey1, selectorKey2] = nodes2.filter(id =>
      id.startsWith('@selector')
    )

    expect(value2.v).toBe(12)
    expect(instanceKey1).toMatch(/^1-\["@ref\(unknown\)-/)
    expect(instanceKey2).toMatch(/^1-\["@ref\(unknown\)-/)

    // the instances received different function references
    expect(instanceKey1).not.toBe(instanceKey2)

    expect(selectorKey1).toMatch(
      /^@selector\(selector1\)-.*?-\["@ref\(Converter\)-/
    )
    expect(selectorKey2).toMatch(
      /^@selector\(selector2\)-.*?-\["@ref\(Converter\)-/
    )

    // the selectors received the same function reference
    expect(selectorKey1.slice(28)).toBe(selectorKey2.slice(28))

    complexEcosystem.reset()
  })
})
