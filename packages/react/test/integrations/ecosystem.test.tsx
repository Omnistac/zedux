import {
  atom,
  Ecosystem,
  createEcosystem,
  injectAtomValue,
  injectSignal,
  injectWhy,
  useAtomState,
  useAtomValue,
  EcosystemProvider,
  useEcosystem,
  getDefaultEcosystem,
  useAtomInstance,
  injectEffect,
} from '@zedux/react'
import React, { useEffect, useState } from 'react'
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
      const signal = injectSignal('1')

      return signal
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

    expect([...ecosystem.n.keys()]).toEqual([
      '@signal(atom1)-1',
      'atom1',
      'atom2',
      'atom3-["1"]',
      'atom4',
      'atom5',
      '@component(Child)-:r0:',
      '@component(Child)-:r1:',
      '@component(Child)-:r2:',
      '@component(Child)-:r3:',
      '@component(Child)-:r4:',
    ])
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
      ecosystem.getInstance(atom1).set('0')
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
    expect([...ecosystem.n.keys()]).toEqual(['atom1'])

    ecosystem.reset()

    expect(evaluations).toEqual(['1', '1'])
    expect([...ecosystem.n.keys()]).toEqual(['atom1'])

    ecosystem.reset({ listeners: true })
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

    expect([...ecosystem.n.keys()]).toEqual(['a', 'b', 'c', 'd'])

    expect(ecosystem.get(atomA)).toBe('aa')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('c')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([overrideB, overrideC])

    expect([...ecosystem.n.keys()]).toEqual(['d'])

    ecosystem.getInstance(atomA)
    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect([...ecosystem.n.keys()]).toEqual(['d', 'a', 'b', 'c'])

    expect(ecosystem.get(atomA)).toBe('a')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('cc')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([])

    expect([...ecosystem.n.keys()]).toEqual(['d', 'a'])

    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect([...ecosystem.n.keys()]).toEqual(['d', 'a', 'b', 'c'])

    expect(ecosystem.get(atomA)).toBe('a')
    expect(ecosystem.get(atomB)).toBe('b')
    expect(ecosystem.get(atomC)).toBe('c')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.setOverrides([overrideA, overrideB, overrideC])

    expect([...ecosystem.n.keys()]).toEqual(['d'])

    ecosystem.getInstance(atomA)
    ecosystem.getInstance(atomB)
    ecosystem.getInstance(atomC)

    expect([...ecosystem.n.keys()]).toEqual(['d', 'a', 'b', 'c'])

    expect(ecosystem.get(atomA)).toBe('aa')
    expect(ecosystem.get(atomB)).toBe('bb')
    expect(ecosystem.get(atomC)).toBe('cc')
    expect(ecosystem.get(atomD)).toBe('d')

    ecosystem.reset({ listeners: true })
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

    ecosystem.reset()
  })

  test('.findAll()', () => {
    const atomA = atom('a', (param: string) => param)
    const atomB = atom('b', () => 'b')

    ecosystem.getInstance(atomA, ['a'])
    ecosystem.getInstance(atomA, ['aa'])
    ecosystem.getInstance(atomB)

    expect(ecosystem.findAll(atomA)).toEqual([
      expect.objectContaining({ id: 'a-["a"]', params: ['a'] }),
      expect.objectContaining({ id: 'a-["aa"]', params: ['aa'] }),
    ])

    expect(ecosystem.findAll('a')).toEqual([
      expect.objectContaining({ id: 'a-["a"]', params: ['a'] }),
      expect.objectContaining({ id: 'a-["aa"]', params: ['aa'] }),
    ])

    expect(ecosystem.findAll('@atom').map(({ id }) => id)).toEqual([
      'a-["a"]',
      'a-["aa"]',
      'b',
    ])

    function Test() {
      useAtomValue(atomA, ['aaa'])
      useAtomInstance(atomA, ['aaa'])

      return null
    }

    renderInEcosystem(<Test />)

    expect(
      ecosystem
        .findAll(['@atom', '@component'])
        .map(({ id }) => id.replace(/-:.*:/, ''))
    ).toEqual([
      '@component(Test)',
      '@component(Test)',
      'a-["a"]',
      'a-["aa"]',
      'a-["aaa"]',
      'b',
    ])

    act(() => {
      ecosystem.reset({ listeners: true })
    })
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

    expect([...ecosystem.n.keys()]).toEqual(['a-["a"]', 'a-["aa"]'])

    ecosystem.reset({ context: { val: 'aa' } })

    expect([...ecosystem.n.keys()]).toEqual(['a-["aa"]', 'a-["aaa"]'])

    expect(onReady).toHaveBeenCalledTimes(2)
    expect(onReady).toHaveBeenLastCalledWith(
      expect.objectContaining({ context: { val: 'aa' } }),
      { val: 'a' }
    )

    ecosystem.reset({ listeners: true })
  })

  test('tags', () => {
    const mock = mockConsole('error')
    const atomA = atom('a', () => 1, { tags: ['a'] })
    const atomB = atom('b', () => 2)

    const ecosystem = createEcosystem({ tags: ['b'], id: 'tags' })
    ecosystem.getInstance(atomA)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered unsafe atom')
    )

    ecosystem.getInstance(atomB)

    expect(mock).toHaveBeenCalledTimes(1)

    ecosystem.reset({ listeners: true })
  })

  test('ecosystems created via EcosystemProvider are destroyed on unmount', async () => {
    jest.useFakeTimers()
    const calls: any[] = []

    function Child() {
      const ecosystem = useEcosystem()

      useEffect(() => {
        const cleanupStart = ecosystem.on('resetStart', event =>
          calls.push(event)
        )
        const cleanupEnd = ecosystem.on('resetEnd', event => calls.push(event))

        return () => {
          cleanupStart()
          cleanupEnd()
        }
      }, [ecosystem])

      return null
    }

    function Test() {
      const [count, setCount] = useState(0)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setCount(state => state + 1)}
          />
          {count < 1 && (
            <EcosystemProvider>
              <Child />
            </EcosystemProvider>
          )}
          {count < 2 && (
            <EcosystemProvider>
              <Child />
            </EcosystemProvider>
          )}
        </>
      )
    }

    const { findByTestId } = render(<Test />)

    const button = await findByTestId('button')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(calls).toEqual([{ type: 'resetStart' }, { type: 'resetEnd' }])
    calls.splice(0, calls.length)

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(calls).toEqual([{ type: 'resetStart' }, { type: 'resetEnd' }])
    calls.splice(0, calls.length)
  })

  test('the default ecosystem is used if no ecosystem is provided', async () => {
    const atom1 = atom('1', () => 'a')
    let ecosystem: any

    function Test() {
      const val = useAtomValue(atom1)
      ecosystem = useEcosystem()

      return <div data-testid="test">{val}</div>
    }

    const { findByTestId } = render(<Test />)
    const div = await findByTestId('test')

    expect(div).toHaveTextContent('a')
    expect(ecosystem).toBe(getDefaultEcosystem())
  })

  test('resets cause rerenders when components are subscribed to resetting atoms', async () => {
    const destructions: any[] = []

    const atom1 = atom('atom1', () => {
      injectEffect(
        () => () => {
          destructions.push('atom1')
        },
        []
      )

      return 'foo'
    })
    const atom2 = atom('atom2', () => {
      injectEffect(
        () => () => {
          destructions.push('atom2')
        },
        []
      )

      return 'bar'
    })

    function Test() {
      const val1 = useAtomValue(atom1)
      const val2 = useAtomValue(atom2)

      return (
        <div>
          <div data-testid="node1">Node 1: {val1}</div>
          <div data-testid="node2">Node 2: {val2}</div>
          <button data-testid="reset" onClick={() => ecosystem.reset()}>
            Reset
          </button>
        </div>
      )
    }

    function App() {
      return (
        <EcosystemProvider ecosystem={ecosystem}>
          <Test />
        </EcosystemProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<App />)

    const node1 = await findByTestId('node1')
    const node2 = await findByTestId('node2')
    const reset = await findByTestId('reset')

    expect(node1).toHaveTextContent('Node 1: foo')
    expect(node2).toHaveTextContent('Node 2: bar')

    act(() => {
      ecosystem.getNode(atom1).set('foo2')
    })

    expect(node1).toHaveTextContent('Node 1: foo2')

    act(() => {
      fireEvent.click(reset)
    })

    // needed because the effects are scheduled during React render and will
    // wait for a microtask without this. This needs to be outside the `act`,
    // since the components render as part of the `act` queue.
    ecosystem.asyncScheduler.flush()

    expect(destructions).toEqual(['atom1', 'atom2'])
    expect(node1).toHaveTextContent('Node 1: foo')

    act(() => {
      ecosystem.getNode(atom2).set('bar2')
    })

    expect(node2).toHaveTextContent('Node 2: bar2')

    act(() => {
      fireEvent.click(reset)
    })

    // Note: Would also need to flush the async scheduler here if this test
    // continued.

    expect(destructions).toEqual(['atom1', 'atom2', 'atom1', 'atom2'])
    expect(node1).toHaveTextContent('Node 1: foo')
    expect(node2).toHaveTextContent('Node 2: bar')
  })
})
