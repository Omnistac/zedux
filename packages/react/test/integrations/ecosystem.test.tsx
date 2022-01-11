import { render } from '@testing-library/react'
import {
  atom,
  Ecosystem,
  createEcosystem,
  EcosystemProvider,
  injectAtomValue,
  injectStore,
  injectWhy,
  useAtomState,
  useAtomValue,
} from '@zedux/react'
import React from 'react'

const testEcosystem = createEcosystem({ id: 'test' })

afterEach(() => {
  testEcosystem.wipe()
})

describe('ecosystem', () => {
  test('big graph', async () => {
    const evaluations: number[] = []
    const evaluate1 = jest.fn(() => evaluations.push(1))
    const evaluate2 = jest.fn(() => evaluations.push(2))
    const evaluate3 = jest.fn(() => evaluations.push(3))
    const evaluate4 = jest.fn(() => evaluations.push(4))
    const evaluate5 = jest.fn(() => evaluations.push(5))
    const childRendered = jest.fn()
    const why5 = jest.fn()

    const atom1 = atom('atom1', () => {
      evaluate1()
      const store = injectStore('1')

      return store
    })

    const atom2 = atom('atom2', () => {
      evaluate2()
      const atom1val = injectAtomValue(atom1)

      return `${atom1val} 2`
    })

    const atom3 = atom('atom3', (id: string) => {
      evaluate3()
      const atom1val = injectAtomValue(atom1)
      const atom2val = injectAtomValue(atom2)

      return `${id} ${atom1val} ${atom2val}`
    })

    const atom4 = atom('atom4', () => {
      evaluate4()
      const atom3val = injectAtomValue(atom3, ['1'])
      const atom1val = injectAtomValue(atom1)

      return `${atom3val} ${atom1val}`
    })

    const atom5 = atom('atom5', () => {
      evaluate5()
      const atom2val = injectAtomValue(atom2)
      const atom4val = injectAtomValue(atom4)
      const atom1val = injectAtomValue(atom1)

      why5(injectWhy())

      return `${atom4val} ${atom2val} ${atom1val}`
    })

    function Child() {
      const atom5val = useAtomValue(atom5)
      const [atom4val] = useAtomState(atom4)
      const atom3val = useAtomValue(atom3, ['1'])
      const atom2val = useAtomValue(atom2)
      const atom1val = useAtomValue(atom1)

      childRendered(atom5val, atom4val, atom3val, atom2val, atom1val)

      return (
        <>
          <div>{atom1val}</div>
          <div>{atom2val}</div>
          <div>{atom3val}</div>
          <div>{atom4val}</div>
          <div>{atom5val}</div>
        </>
      )
    }

    function Test() {
      return (
        <EcosystemProvider ecosystem={testEcosystem}>
          <Child />
        </EcosystemProvider>
      )
    }

    const { findByText } = render(<Test />)

    expect(testEcosystem._instances).toEqual({
      atom1: expect.any(Object),
      atom2: expect.any(Object),
      'atom3-["1"]': expect.any(Object),
      atom4: expect.any(Object),
      atom5: expect.any(Object),
    })
    expect(childRendered).toHaveBeenCalledTimes(1)
    expect(childRendered).toHaveBeenLastCalledWith(
      '1 1 1 2 1 1 2 1',
      '1 1 1 2 1',
      '1 1 1 2',
      '1 2',
      '1'
    )
    expect(evaluations).toEqual([5, 2, 1, 4, 3])

    testEcosystem.getInstance(atom1).setState('0')

    await findByText('1 0 0 2 0 0 2 0')

    expect(childRendered).toHaveBeenCalledTimes(6) // unfortunate but what can be done
    expect(childRendered).toHaveBeenLastCalledWith(
      '1 0 0 2 0 0 2 0',
      '1 0 0 2 0',
      '1 0 0 2',
      '0 2',
      '0'
    )
    expect(evaluations).toEqual([5, 2, 1, 4, 3, 1, 2, 3, 4, 5])
  })

  test('ecosystem reset runs preload function again', () => {
    const evaluations: string[] = []
    const atom1 = atom('atom1', () => {
      evaluations.push('1')
      return '1'
    })

    const preload = (theEcosystem: Ecosystem) => {
      theEcosystem.getInstance(atom1)
    }

    const preloadedEcosystem = createEcosystem({ preload })

    expect(evaluations).toEqual(['1'])
    expect(preloadedEcosystem._instances).toEqual({
      atom1: expect.any(Object),
    })

    preloadedEcosystem.reset()

    expect(evaluations).toEqual(['1', '1'])
    expect(preloadedEcosystem._instances).toEqual({
      atom1: expect.any(Object),
    })

    preloadedEcosystem.destroy(true)
  })

  test('setting overrides kills all existing instances for previously- and newly-overridden atoms', () => {
    const atomA = atom('a', () => 'a')
    const atomB = atom('b', () => 'b')
    const atomC = atom('c', () => 'c')
    const atomD = atom('d', () => 'd')

    const overrideA = atomA.override(() => 'aa')
    const overrideB = atomB.override(() => 'bb')
    const overrideC = atomC.override(() => 'cc')

    const es = createEcosystem({
      id: 'overrides',
      overrides: [overrideA, overrideB],
    })
    es.getInstance(atomA)
    es.getInstance(atomB)
    es.getInstance(atomC)
    es.getInstance(atomD)

    expect(es._instances).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(es.get(atomA)).toBe('aa')
    expect(es.get(atomB)).toBe('bb')
    expect(es.get(atomC)).toBe('c')
    expect(es.get(atomD)).toBe('d')

    es.setOverrides([overrideB, overrideC])

    expect(es._instances).toEqual({
      d: expect.any(Object),
    })

    es.getInstance(atomA)
    es.getInstance(atomB)
    es.getInstance(atomC)

    expect(es._instances).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(es.get(atomA)).toBe('a')
    expect(es.get(atomB)).toBe('bb')
    expect(es.get(atomC)).toBe('cc')
    expect(es.get(atomD)).toBe('d')

    es.setOverrides([])

    expect(es._instances).toEqual({
      a: expect.any(Object),
      d: expect.any(Object),
    })

    es.getInstance(atomB)
    es.getInstance(atomC)

    expect(es._instances).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(es.get(atomA)).toBe('a')
    expect(es.get(atomB)).toBe('b')
    expect(es.get(atomC)).toBe('c')
    expect(es.get(atomD)).toBe('d')

    es.setOverrides([overrideA, overrideB, overrideC])

    expect(es._instances).toEqual({
      d: expect.any(Object),
    })

    es.getInstance(atomA)
    es.getInstance(atomB)
    es.getInstance(atomC)

    expect(es._instances).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(es.get(atomA)).toBe('aa')
    expect(es.get(atomB)).toBe('bb')
    expect(es.get(atomC)).toBe('cc')
    expect(es.get(atomD)).toBe('d')

    es.destroy(true)
  })

  test('.findInstances()', () => {
    const atomA = atom('a', (param: string) => param)
    const atomB = atom('b', () => 'b')

    const es = createEcosystem({ id: 'findInstances' })

    es.getInstance(atomA, ['a'])
    es.getInstance(atomA, ['aa'])
    es.getInstance(atomB)

    expect(es.findInstances(atomA)).toEqual([
      expect.objectContaining({ params: ['a'] }),
      expect.objectContaining({ params: ['aa'] }),
    ])

    expect(es.findInstances('a')).toEqual([
      expect.objectContaining({ params: ['a'] }),
      expect.objectContaining({ params: ['aa'] }),
    ])

    es.destroy(true)
  })

  test('preload', () => {
    const atomA = atom('a', (param: string) => param)

    const preload = jest.fn((es: Ecosystem<{ val: string }>) => {
      es.get(atomA, [es.context.val])
      es.get(atomA, [`${es.context.val}a`])
    })

    const es = createEcosystem({
      context: { val: 'a' },
      id: 'preload',
      preload,
    })

    expect(es._instances).toEqual({
      'a-["a"]': expect.any(Object),
      'a-["aa"]': expect.any(Object),
    })

    es.reset({ val: 'aa' })

    expect(es._instances).toEqual({
      'a-["aa"]': expect.any(Object),
      'a-["aaa"]': expect.any(Object),
    })

    expect(preload).toHaveBeenCalledTimes(2)
    expect(preload).toHaveBeenLastCalledWith(
      expect.objectContaining({ context: { val: 'aa' } }),
      { val: 'a' }
    )
  })
})
