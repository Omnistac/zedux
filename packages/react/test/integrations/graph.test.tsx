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
  AtomInstanceType,
  injectAtomInstance,
  injectRef,
} from '@zedux/react'
import { Static } from '@zedux/react/utils'
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

const ecosystem = createEcosystem({ id: 'test' })

afterEach(() => {
  ecosystem.reset()
})

describe('graph', () => {
  test('injectAtomGetters', async () => {
    jest.useFakeTimers()

    const ecosystem = createEcosystem({ id: 'test1' })

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
      <EcosystemProvider ecosystem={ecosystem}>
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

    expect(ecosystem._graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(ecosystem._graph.nodes.atom2.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(ecosystem._graph.nodes.atom3).toBeUndefined()

    expect(ecosystem._graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom2: true,
    })

    const button = await findByText('toggle')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div).toHaveTextContent('4')

    expect(ecosystem._graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(ecosystem._graph.nodes.atom2.dependents).toEqual({})

    expect(ecosystem._graph.nodes.atom3.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(ecosystem._graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom3: true,
    })
  })

  test('getInstance(atom) returns the instance', () => {
    const evaluations: number[] = []

    const ion1 = ion('ion1', ({ getInstance }) => {
      const instance1 = getInstance(atom1)
      const instance2 = getInstance(atom2)

      evaluations.push(instance1.store.getState())

      return api(
        instance1.store.getState() + instance2.store.getState()
      ).setExports({
        set: (val: number) => getInstance(atom1).setState(val + 1),
      })
    })

    const ionInstance = ecosystem.getInstance(ion1)

    expect(ecosystem._instances).toEqual({
      atom1: expect.any(Object),
      atom2: expect.any(Object),
      ion1: expect.any(Object),
    })

    expect(ecosystem._graph.nodes).toEqual({
      atom1: {
        dependencies: {},
        dependents: {
          ion1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: Static,
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
            flags: Static,
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

    ionInstance.exports.set(11)

    expect(evaluations).toEqual([1])
    expect(ionInstance.store.getState()).toBe(3)
    expect(ecosystem.getInstance(atom1).store.getState()).toBe(12)
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

    const instance = ecosystem.getInstance(atomD)

    expect(ecosystem._graph.nodes).toEqual({
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

    expect(ecosystem._graph.nodes).toEqual({
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
  })

  test('atom instances can be passed as atom params', () => {
    const instance1 = ecosystem.getInstance(atom1)

    const testAtom = atom(
      'test',
      (instance: AtomInstanceType<typeof atom1>) => {
        const subRef = injectRef(false)
        const asDep = injectAtomInstance(instance) // register static dep
        const { get } = injectAtomGetters()

        if (subRef.current) get(asDep)

        return api(asDep.getState()).setExports({ subRef })
      }
    )

    const instance = ecosystem.getInstance(testAtom, [instance1])

    expect(instance.getState()).toBe(1)

    instance1.setState(2)

    expect(instance.getState()).toBe(1)

    instance.exports.subRef.current = true
    instance.invalidate()

    expect(instance.getState()).toBe(2)

    instance1.setState(3)

    expect(instance.getState()).toBe(3)
  })
})
