import { act, fireEvent, render } from '@testing-library/react'
import {
  atom,
  AtomGetters,
  createEcosystem,
  EcosystemProvider,
  injectAtomSelector,
  ion,
  useAtomInstance,
  useAtomSelector,
} from '@zedux/react'
import React, { useEffect, useState } from 'react'

const testEcosystem = createEcosystem({ id: 'test' })
const testAtom = atom('testAtom', (key: string) => key)

afterEach(() => {
  testEcosystem.reset()
})

describe('selection', () => {
  test('default argsComparator prevents selector from running if selector reference and all args are the same', async () => {
    jest.useFakeTimers()

    const selector1 = jest.fn(({ get }: AtomGetters, key: string) => {
      return get(testAtom, [key])
    })

    const selector2 = jest.fn(({ select }: AtomGetters) => {
      const val = select(selector1, 'a')
      return val
    })

    function Test() {
      const [, setState] = useState(1)
      const val = useAtomSelector(selector2)

      return (
        <>
          <button onClick={() => setState(2)} data-testid="button" />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const button = await findByTestId('button')

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect((await findByTestId('text')).innerHTML).toBe('a')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)

    act(() => {
      testEcosystem.find(testAtom, ['a'])?.setState('b')
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect((await findByTestId('text')).innerHTML).toBe('b')
  })

  test('selector is recreated if an unmounted component destroys it after a newly-rendered component reads from the cache but before the new component can create the dependency', async () => {
    jest.useFakeTimers()
    const selector = jest.fn(({ get }: AtomGetters) => get(testAtom, ['a']))

    function DyingComponent() {
      const instance = useAtomInstance(testAtom, ['a'])

      // the order of useAtomSelector and this useEffect is important to repro this!
      const val = useAtomSelector(selector)

      useEffect(() => () => {
        instance.setState('b')
      })

      return <div data-testid="text">{val}</div>
    }

    function NewComponent() {
      const val = useAtomSelector(selector)

      return <div data-testid="text">{val}</div>
    }

    function Test() {
      const [view, setView] = useState(1)

      return (
        <>
          <button onClick={() => setView(2)} data-testid="button" />
          {view === 1 ? <DyingComponent /> : <NewComponent />}
        </>
      )
    }

    const { findByTestId } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const button = await findByTestId('button')

    expect(selector).toHaveBeenCalledTimes(1)
    expect((await findByTestId('text')).innerHTML).toBe('a')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector).toHaveBeenCalledTimes(2)
    expect((await findByTestId('text')).innerHTML).toBe('b')
  })

  test('selectors are recreated when necessary on component remount', async () => {
    jest.useFakeTimers()
    let b = 2
    const selector1 = jest.fn(() => ({ a: 1 })) // two dependents; shouldn't rerun
    const selector2 = jest.fn(() => ({ b: b++ })) // one dependent; should rerun
    const selector3 = jest.fn((_: AtomGetters, arg: number) => 'c' + arg) // args change; should run with 2 different args

    function ResurrectingComponent({ view }: { view: number }) {
      useAtomSelector(selector1)
      const { b } = useAtomSelector(selector2)
      useAtomSelector(selector3, view)

      return <div data-testid="text">{b}</div>
    }

    function Test() {
      useAtomSelector(selector1)
      const [view, setView] = useState(1)

      return (
        <>
          <button onClick={() => setView(2)} data-testid="button" />
          <ResurrectingComponent key={view} view={view} />
        </>
      )
    }

    const { findByTestId } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const button = await findByTestId('button')

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(selector3).toHaveBeenCalledTimes(1)
    expect((await findByTestId('text')).innerHTML).toBe('2')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect(selector3).toHaveBeenCalledTimes(2)
    expect((await findByTestId('text')).innerHTML).toBe('3')
  })

  test('inline selectors are swapped out and evaluated every time the ref changes', async () => {
    jest.useFakeTimers()
    const selector = jest.fn((_, arg: number) => arg * 2)

    function Test() {
      const [view, setView] = useState(1)
      const val = useAtomSelector(({ select }) => select(selector, view))

      return (
        <>
          <button
            onClick={() => setView(val => val + 1)}
            data-testid="button"
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const button = await findByTestId('button')

    expect(selector).toHaveBeenCalledTimes(1)
    expect(selector).toHaveBeenLastCalledWith(expect.any(Object), 1)
    expect((await findByTestId('text')).innerHTML).toBe('2')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector).toHaveBeenCalledTimes(2)
    expect(selector).toHaveBeenLastCalledWith(expect.any(Object), 2)
    expect((await findByTestId('text')).innerHTML).toBe('4')
  })

  test('same-name selectors share the namespace when destroyed and recreated at different times', () => {
    const rootAtom = atom('root', () => 1, { ttl: 0 })
    const selector1 = ({ get }: AtomGetters) => get(rootAtom) + 2
    const selector2 = ({ get }: AtomGetters) => get(rootAtom) + 3
    const atom1 = atom('1', () => injectAtomSelector(selector1), { ttl: 0 })
    const atom2 = ion('2', ({ select }) => select(selector2), { ttl: 0 })
    const NAME = 'common-name'
    const FULL_NAME = `@@selector-${NAME}`
    const originalGenerateId = testEcosystem._idGenerator.generateId

    let idCounter = 0
    testEcosystem._idGenerator.generateId = () => `testgen${idCounter++}`

    Object.defineProperty(selector1, 'name', { value: NAME })
    Object.defineProperty(selector2, 'name', { value: NAME })

    const instance1 = testEcosystem.getInstance(atom1)
    const cleanup1 = instance1.addDependent()

    expect(testEcosystem._graph.nodes).toEqual({
      [FULL_NAME]: {
        dependencies: { root: true },
        dependents: {
          1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'select',
          },
        },
        isAtomSelector: true,
        weight: 2,
      },
      1: {
        dependencies: { [FULL_NAME]: true },
        dependents: {
          testgen0: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 3,
            operation: 'addDependent',
          },
        },
        isAtomSelector: undefined,
        weight: 3,
      },
      root: {
        dependencies: {},
        dependents: {
          [FULL_NAME]: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
    })
    expect(instance1.getState()).toBe(3)

    cleanup1()

    expect(testEcosystem._graph.nodes).toEqual({})

    const instance2 = testEcosystem.getInstance(atom2)
    const cleanup2 = instance2.addDependent()

    expect(testEcosystem._graph.nodes).toEqual({
      [FULL_NAME]: {
        dependencies: { root: true },
        dependents: {
          2: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'select',
          },
        },
        isAtomSelector: true,
        weight: 2,
      },
      2: {
        dependencies: { [FULL_NAME]: true },
        dependents: {
          testgen1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 3,
            operation: 'addDependent',
          },
        },
        isAtomSelector: undefined,
        weight: 3,
      },
      root: {
        dependencies: {},
        dependents: {
          [FULL_NAME]: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
    })
    expect(instance2.getState()).toBe(4)

    const instance3 = testEcosystem.getInstance(atom1)
    const cleanup3 = instance3.addDependent()

    expect(testEcosystem._graph.nodes).toEqual({
      [FULL_NAME]: {
        dependencies: { root: true },
        dependents: {
          2: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'select',
          },
        },
        isAtomSelector: true,
        weight: 2,
      },
      testgen2: {
        dependencies: { root: true },
        dependents: {
          1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'select',
          },
        },
        isAtomSelector: true,
        weight: 2,
      },
      1: {
        dependencies: { testgen2: true },
        dependents: {
          testgen3: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 3,
            operation: 'addDependent',
          },
        },
        isAtomSelector: undefined,
        weight: 3,
      },
      2: {
        dependencies: { [FULL_NAME]: true },
        dependents: {
          testgen1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 3,
            operation: 'addDependent',
          },
        },
        isAtomSelector: undefined,
        weight: 3,
      },
      root: {
        dependencies: {},
        dependents: {
          [FULL_NAME]: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
          testgen2: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
    })
    expect(instance1.getState()).toBe(3)
    expect(instance2.getState()).toBe(4)

    cleanup2()

    expect(testEcosystem._graph.nodes).toEqual({
      testgen2: {
        dependencies: { root: true },
        dependents: {
          1: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'select',
          },
        },
        isAtomSelector: true,
        weight: 2,
      },
      1: {
        dependencies: { testgen2: true },
        dependents: {
          testgen3: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 3,
            operation: 'addDependent',
          },
        },
        isAtomSelector: undefined,
        weight: 3,
      },
      root: {
        dependencies: {},
        dependents: {
          testgen2: {
            callback: undefined,
            createdAt: expect.any(Number),
            flags: 0,
            operation: 'get',
          },
        },
        isAtomSelector: undefined,
        weight: 1,
      },
    })
    expect(instance1.getState()).toBe(3)

    cleanup3()

    expect(testEcosystem._graph.nodes).toEqual({})

    testEcosystem._idGenerator.generateId = originalGenerateId
  })
})
