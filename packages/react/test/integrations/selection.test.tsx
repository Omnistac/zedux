import { act, fireEvent } from '@testing-library/react'
import {
  atom,
  AtomGetters,
  injectAtomSelector,
  ion,
  useAtomInstance,
  useAtomSelector,
} from '@zedux/react'
import React, { useEffect, useState } from 'react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

const testAtom = atom('testAtom', (key: string) => key)

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

    const { findByTestId } = renderInEcosystem(<Test />)

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
      ecosystem.find(testAtom, ['a'])?.setState('b')
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect((await findByTestId('text')).innerHTML).toBe('b')
  })

  test("a state change from an unmounting component's effect cleanup triggers rerenders in newly-created components that use the updated atom or its dependents", async () => {
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

    const { findByTestId } = renderInEcosystem(<Test />)

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
      useAtomSelector(selector2)
      const val = useAtomSelector(selector3, view)

      return <div data-testid="text">{val}</div>
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

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(selector3).toHaveBeenCalledTimes(1)
    expect((await findByTestId('text')).innerHTML).toBe('c1')

    // reset the 3 useId calls in ResurrectingComponent's useAtomSelectors
    ;(globalThis as any).clearUseIdEntry(1)
    ;(globalThis as any).clearUseIdEntry(2)
    ;(globalThis as any).clearUseIdEntry(3)

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(selector3).toHaveBeenCalledTimes(2)
    expect((await findByTestId('text')).innerHTML).toBe('c2')
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

    const { findByTestId } = renderInEcosystem(<Test />)

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

  test("useAtomSelector triggers component rerenders when the selector's value becomes undefined", async () => {
    jest.useFakeTimers()

    const rootAtom = atom('root', { a: 1 } as
      | { a: number }
      | number
      | undefined)
    const selector = ({ get }: AtomGetters) => get(rootAtom)

    function Test() {
      const val = useAtomSelector(selector)

      return <div data-testid="text">{typeof val}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')
    const instance = ecosystem.getInstance(rootAtom)

    expect(div.innerHTML).toBe('object')

    act(() => {
      instance.setState(undefined)
    })

    jest.runAllTimers()

    expect(div.innerHTML).toBe('undefined')

    act(() => {
      instance.setState(1)
    })

    jest.runAllTimers()

    expect(div.innerHTML).toBe('number')

    act(() => {
      instance.setState(undefined)
    })

    jest.runAllTimers()

    expect(div.innerHTML).toBe('undefined')
  })

  test("selector caches use the function name if `name` isn't given", () => {
    const selector = {
      selector: function testName() {
        return 2
      },
    }

    const cache = ecosystem.selectors.getCache(selector)

    expect(cache.id).toBe('@@selector-testName-0')
  })

  test('same-name selectors share the namespace when destroyed and recreated at different times', () => {
    const rootAtom = atom('root', () => 1, { ttl: 0 })
    const selector1 = ({ get }: AtomGetters) => get(rootAtom) + 2
    const selector2 = ({ get }: AtomGetters) => get(rootAtom) + 3
    const atom1 = atom('1', () => injectAtomSelector(selector1), { ttl: 0 })
    const atom2 = ion('2', ({ select }) => select(selector2), { ttl: 0 })
    const NAME = 'common-name'

    Object.defineProperty(selector1, 'name', { value: NAME })
    Object.defineProperty(selector2, 'name', { value: NAME })

    const instance1 = ecosystem.getInstance(atom1)
    const cleanup1 = instance1.addDependent()

    expect(ecosystem._graph.nodes).toMatchSnapshot()
    expect(instance1.getState()).toBe(3)

    cleanup1()

    expect(ecosystem._graph.nodes).toEqual({})

    const instance2 = ecosystem.getInstance(atom2)
    const cleanup2 = instance2.addDependent()

    expect(ecosystem._graph.nodes).toMatchSnapshot()
    expect(instance2.getState()).toBe(4)

    const instance3 = ecosystem.getInstance(atom1)
    const cleanup3 = instance3.addDependent()

    expect(ecosystem._graph.nodes).toMatchSnapshot()
    expect(instance1.getState()).toBe(3)
    expect(instance2.getState()).toBe(4)

    cleanup2()

    expect(ecosystem._graph.nodes).toMatchSnapshot()
    expect(instance1.getState()).toBe(3)

    cleanup3()

    expect(ecosystem._graph.nodes).toEqual({})
  })
})
