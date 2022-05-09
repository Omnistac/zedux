import { fireEvent } from '@testing-library/dom'
import { act, render } from '@testing-library/react'
import {
  api,
  atom,
  createStore,
  createEcosystem,
  EcosystemProvider,
  injectAtomGetters,
  injectAtomValue,
  injectStore,
  ion,
  useAtomInstance,
  useAtomValue,
  EdgeFlag,
} from '@zedux/react'
import React from 'react'

const atom1 = atom('atom1', () => 1)
const atom2 = atom('atom2', () => 2)
const atom3 = atom('atom3', () => 3)

const atom4 = atom('atom4', () => {
  const switchStore = injectStore(true)
  const sumStore = injectStore(0)
  const store = injectStore(() =>
    createStore({ switch: switchStore, sum: sumStore })
  )
  const { get } = injectAtomGetters()

  const one = get(atom1)
  const two = switchStore.getState() ? get(atom2) : get(atom3)

  // won't cause a reevaluation loop
  sumStore.setState(one + two)

  return api(store).setExports({
    toggle: () => switchStore.setState(val => !val),
  })
})

describe('graph', () => {
  test('injectAtomGetters', async () => {
    jest.useFakeTimers()

    const testEcosystem = createEcosystem({ id: 'test1' })

    function Test() {
      const { sum } = useAtomValue(atom4)
      const { toggle } = useAtomInstance(atom4).exports

      return (
        <>
          <div data-testid="sum">{sum}</div>
          <button onClick={toggle}>toggle</button>
        </>
      )
    }

    const { findByTestId, findByText } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const div = await findByTestId('sum')
    expect(div).toHaveTextContent('3')

    const expectedEdges = {
      callback: undefined,
      createdAt: expect.any(Number),
      flags: 0,
      operation: 'get',
    }

    expect(testEcosystem._graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem._graph.nodes.atom2.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem._graph.nodes.atom3).toBeUndefined()

    expect(testEcosystem._graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom2: true,
    })

    const button = await findByText('toggle')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div).toHaveTextContent('4')

    expect(testEcosystem._graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem._graph.nodes.atom2.dependents).toEqual({})

    expect(testEcosystem._graph.nodes.atom3.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem._graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom3: true,
    })
  })

  test('getInstance(atom) returns the instance', () => {
    const testEcosystem = createEcosystem({ id: 'test2' })
    const evaluations: number[] = []

    const ion1 = ion(
      'ion1',
      ({ getInstance }) => {
        const instance1 = getInstance(atom1)
        const instance2 = getInstance(atom2)

        evaluations.push(instance1.store.getState())

        return instance1.store.getState() + instance2.store.getState()
      },
      ({ getInstance, set }, newVal) => {
        getInstance(atom1).setState(newVal)
        set(atom1, 12)
      }
    )

    const ionInstance = testEcosystem.getInstance(ion1)

    expect(testEcosystem._instances).toEqual({
      atom1: expect.any(Object),
      atom2: expect.any(Object),
      ion1: expect.any(Object),
    })

    expect(testEcosystem._graph.nodes).toEqual({
      atom1: {
        dependencies: {},
        dependents: {
          ion1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: EdgeFlag.Static,
            operation: 'getInstance',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      atom2: {
        dependencies: {},
        dependents: {
          ion1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: EdgeFlag.Static,
            operation: 'getInstance',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      ion1: {
        dependencies: { atom1: true, atom2: true },
        dependents: {},
        isAtomSelector: undefined,
        weight: 1, // static dependencies don't affect the weight
      },
    })

    expect(evaluations).toEqual([1])

    ionInstance.setState(11)

    expect(evaluations).toEqual([1])
    expect(ionInstance.store.getState()).toBe(3)
    expect(testEcosystem.getInstance(atom1).store.getState()).toBe(12)
  })

  test('on reevaluation, get() updates the graph', () => {
    jest.useFakeTimers()
    let useB = true
    const atomA = atom('a', () => 'a')
    const atomB = atom('b', (param: string) => param)
    const atomC = atom('c', 'c')
    const atomD = ion('d', ({ get }) => {
      const a = injectAtomValue(atomA)
      const b = useB ? get(atomB, ['b']) : get(atomC)

      return a + b
    })

    const es = createEcosystem({ id: 'reevaluation' })

    const instance = es.getInstance(atomD)

    expect(es._graph.nodes).toEqual({
      a: {
        dependencies: {},
        dependents: {
          d: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'injectAtomValue',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      'b-["b"]': {
        dependencies: {},
        dependents: {
          d: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      d: {
        dependencies: {
          a: true,
          'b-["b"]': true,
        },
        dependents: {},
        isAtomSelector: undefined,
        weight: 3,
      },
    })

    useB = false
    instance.invalidate()
    jest.runAllTimers()

    expect(es._graph.nodes).toEqual({
      a: {
        dependencies: {},
        dependents: {
          d: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'injectAtomValue',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      'b-["b"]': {
        dependencies: {},
        dependents: {},
        isAtomSelector: undefined,
        weight: 1,
      },
      c: {
        dependencies: {},
        dependents: {
          d: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
      d: {
        dependencies: {
          a: true,
          c: true,
        },
        dependents: {},
        isAtomSelector: undefined,
        weight: 3,
      },
    })

    es.destroy()
  })
})
