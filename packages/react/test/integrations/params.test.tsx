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
    const value1 = complexEcosystem.selectors.getCache(selector1, [reusedFn])

    const [instanceKey] = Object.keys(complexEcosystem._instances)
    const [selectorKey] = Object.keys(complexEcosystem.selectors._items)

    expect(value1.result).toBe(1)
    expect(instanceKey).toMatch(/^1-\["anonFn-/)
    expect(selectorKey).toMatch(/^@@selector-selector1-\["reusedFn-/)

    const value2 = complexEcosystem.selectors.getCache(selector2, [reusedFn])

    const [instanceKey1, instanceKey2] = Object.keys(
      complexEcosystem._instances
    )
    const [selectorKey1, selectorKey2] = Object.keys(
      complexEcosystem.selectors._items
    )

    expect(value2.result).toBe(12)
    expect(instanceKey1).toMatch(/^1-\["anonFn-/)
    expect(instanceKey2).toMatch(/^1-\["anonFn-/)

    // the instances received different function references
    expect(instanceKey1).not.toBe(instanceKey2)

    expect(selectorKey1).toMatch(/^@@selector-selector1-\["reusedFn-/)
    expect(selectorKey2).toMatch(/^@@selector-selector2-\["reusedFn-/)

    // the selectors received the same function reference
    expect(selectorKey1.slice(20)).toBe(selectorKey2.slice(20))

    complexEcosystem.destroy()
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
    const value1 = complexEcosystem.selectors.getCache(selector1, [
      reusedInstance,
    ])

    const [instanceKey] = Object.keys(complexEcosystem._instances)
    const [selectorKey] = Object.keys(complexEcosystem.selectors._items)

    expect(value1.result).toBe(1)
    expect(instanceKey).toMatch(/^1-\["UnknownClass-/)
    expect(selectorKey).toMatch(/^@@selector-selector1-\["Converter-/)

    const value2 = complexEcosystem.selectors.getCache(selector2, [
      reusedInstance,
    ])

    const [instanceKey1, instanceKey2] = Object.keys(
      complexEcosystem._instances
    )
    const [selectorKey1, selectorKey2] = Object.keys(
      complexEcosystem.selectors._items
    )

    expect(value2.result).toBe(12)
    expect(instanceKey1).toMatch(/^1-\["UnknownClass-/)
    expect(instanceKey2).toMatch(/^1-\["UnknownClass-/)

    // the instances received different function references
    expect(instanceKey1).not.toBe(instanceKey2)

    expect(selectorKey1).toMatch(/^@@selector-selector1-\["Converter-/)
    expect(selectorKey2).toMatch(/^@@selector-selector2-\["Converter-/)

    // the selectors received the same function reference
    expect(selectorKey1.slice(20)).toBe(selectorKey2.slice(20))

    complexEcosystem.destroy()
  })
})
