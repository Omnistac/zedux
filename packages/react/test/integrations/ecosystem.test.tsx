import {
  atom,
  Ecosystem,
  createEcosystem,
  injectAtomValue,
  injectStore,
  injectWhy,
  useAtomState,
  useAtomValue,
  EcosystemProvider,
  getEcosystem,
} from '@zedux/react'
import React, { useState } from 'react'
import { act } from '@testing-library/react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { fireEvent, render } from '@testing-library/react'
import { mockConsole } from '../utils/console'

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

    const { findByText } = renderInEcosystem(<Child />)

    expect(Object.fromEntries(ecosystem.n)).toEqual({
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

    act(() => {
      ecosystem.getInstance(atom1).setState('0')
    })

    await findByText('1 0 0 2 0 0 2 0')

    expect(childRendered).toHaveBeenCalledTimes(2)
    expect(childRendered).toHaveBeenLastCalledWith(
      '1 0 0 2 0 0 2 0',
      '1 0 0 2 0',
      '1 0 0 2',
      '0 2',
      '0'
    )
    expect(evaluations).toEqual([5, 2, 1, 4, 3, 1, 2, 3, 4, 5])

    expect(ecosystem.viewGraph('flat')).toMatchSnapshot()
    expect(ecosystem.viewGraph('bottom-up')).toMatchSnapshot()
    expect(ecosystem.viewGraph('top-down')).toMatchSnapshot()
  })

  test('ecosystem reset runs onReady function again', () => {
    const evaluations: string[] = []
    const atom1 = atom('atom1', () => {
      evaluations.push('1')
      return '1'
    })

    const onReady = (theEcosystem: Ecosystem) => {
      theEcosystem.getInstance(atom1)
    }

    const ecosystem = createEcosystem({ onReady })

    expect(evaluations).toEqual(['1'])
    expect(Object.fromEntries(ecosystem.n)).toEqual({
      atom1: expect.any(Object),
    })

    ecosystem.reset()

    expect(evaluations).toEqual(['1', '1'])
    expect(Object.fromEntries(ecosystem.n)).toEqual({
      atom1: expect.any(Object),
    })

    ecosystem.destroy(true)
  })

  test('setting overrides kills all existing instances for previously- and newly-overridden atoms', () => {
    const atomA = atom('a', () => 'a')
    const atomB = atom('b', () => 'b')
    const atomC = atom('c', () => 'c')
    const atomD = atom('d', () => 'd')

    const overrideA = atomA.override(() => 'aa')
    const overrideB = atomB.override(() => 'bb')
    const overrideC = atomC.override(() => 'cc')

    const ecosystem = createEcosystem({
      overrides: [overrideA, overrideB],
    })
    ecosystem.getInstance(atomA)
    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)
    ecosystem.getInstance(atomD)

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(ecosystem.get(atomA)).toBe('aa')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('c')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([overrideB, overrideC])

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      d: expect.any(Object),
    })

    ecosystem.getInstance(atomA)
    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(ecosystem.get(atomA)).toBe('a')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('cc')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([])

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      a: expect.any(Object),
      d: expect.any(Object),
    })

    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(ecosystem.get(atomA)).toBe('a')
    expect(ecosystem.get(atomB)).toBe('b')
    expect(ecosystem.get(atomC)).toBe('c')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([overrideA, overrideB, overrideC])

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      d: expect.any(Object),
    })

    ecosystem.getInstance(atomA)
    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
      c: expect.any(Object),
      d: expect.any(Object),
    })

    expect(ecosystem.get(atomA)).toBe('aa')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('cc')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.destroy(true)
  })

  test('find', () => {
    const atomA = atom('a', (param: string) => param)

    const instance1 = ecosystem.getInstance(atomA, ['a'])
    const instance2 = ecosystem.find(atomA, ['a'])
    const instance3 = ecosystem.find('a')
    const instance4 = ecosystem.find('a-["a"]')
    const instance5 = ecosystem.find('a-["b"]')

    expect(instance2).toBe(instance1)
    expect(instance3).toBe(instance1)
    expect(instance4).toBe(instance1)
    expect(instance5).toBeUndefined()

    ecosystem.destroy()
  })

  test('.findAll()', () => {
    const atomA = atom('a', (param: string) => param)
    const atomB = atom('b', () => 'b')

    ecosystem.getInstance(atomA, ['a'])
    ecosystem.getInstance(atomA, ['aa'])
    ecosystem.getInstance(atomB)

    expect(ecosystem.findAll(atomA)).toEqual({
      'a-["a"]': expect.objectContaining({ params: ['a'] }),
      'a-["aa"]': expect.objectContaining({ params: ['aa'] }),
    })

    expect(ecosystem.findAll('a')).toEqual({
      'a-["a"]': expect.objectContaining({ params: ['a'] }),
      'a-["aa"]': expect.objectContaining({ params: ['aa'] }),
    })

    ecosystem.destroy(true)
  })

  test('onReady', () => {
    const atomA = atom('a', (param: string) => param)

    const onReady = jest.fn((ecosystem: Ecosystem<{ val: string }>) => {
      ecosystem.get(atomA, [ecosystem.context.val])
      ecosystem.get(atomA, [`${ecosystem.context.val}a`])
    })

    const ecosystem = createEcosystem({
      context: { val: 'a' },
      id: 'onReady',
      onReady,
    })

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      'a-["a"]': expect.any(Object),
      'a-["aa"]': expect.any(Object),
    })

    ecosystem.reset({ val: 'aa' })

    expect(Object.fromEntries(ecosystem.n)).toEqual({
      'a-["aa"]': expect.any(Object),
      'a-["aaa"]': expect.any(Object),
    })

    expect(onReady).toHaveBeenCalledTimes(2)
    expect(onReady).toHaveBeenLastCalledWith(
      expect.objectContaining({ context: { val: 'aa' } }),
      { val: 'a' }
    )

    ecosystem.destroy(true)
  })

  test('flags', () => {
    const mock = mockConsole('error')
    const atomA = atom('a', () => 1, { flags: ['a'] })
    const atomB = atom('b', () => 2)

    const ecosystem = createEcosystem({ flags: ['b'], id: 'flags' })
    ecosystem.getInstance(atomA)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered unsafe atom')
    )

    ecosystem.getInstance(atomB)

    expect(mock).toHaveBeenCalledTimes(1)

    ecosystem.destroy()
  })

  test('destroyOnUnmount destroys only when the last EcosystemProvider providing the ecosystem unmounts', async () => {
    jest.useFakeTimers()
    const testEcosystem = createEcosystem({ destroyOnUnmount: true })

    function Test() {
      const [count, setCount] = useState(0)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setCount(state => state + 1)}
          />
          {count < 1 && <EcosystemProvider ecosystem={testEcosystem} />}
          {count < 2 && <EcosystemProvider ecosystem={testEcosystem} />}
        </>
      )
    }

    const { findByTestId } = render(<Test />)

    const button = await findByTestId('button')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(getEcosystem(testEcosystem.id)).toBe(testEcosystem)

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(getEcosystem(testEcosystem.id)).toBeUndefined()
  })
})
