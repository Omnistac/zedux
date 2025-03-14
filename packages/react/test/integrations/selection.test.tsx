import { act, fireEvent } from '@testing-library/react'
import {
  atom,
  AtomGetters,
  Ecosystem,
  injectAtomInstance,
  injectAtomSelector,
  injectAtomValue,
  ion,
  useAtomInstance,
  useAtomSelector,
} from '@zedux/react'
import React, { useEffect, useState } from 'react'
import { ecosystem, snapshotNodes } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

const testAtom = atom('testAtom', (key: string) => key)

describe('selection', () => {
  test('default argsComparator prevents selector from running if selector reference and all args are the same', async () => {
    jest.useFakeTimers()

    const selector1 = jest.fn(({ get }: AtomGetters, key: string) => {
      return get(testAtom, [key])
    })

    const selector2 = jest.fn(({ get }: AtomGetters) => {
      const val = get(selector1, ['a'])
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
    expect(await findByTestId('text')).toHaveTextContent('a')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)

    act(() => {
      ecosystem.find(testAtom, ['a'])?.set('b')
      jest.runAllTimers()
    })

    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect(await findByTestId('text')).toHaveTextContent('b')
  })

  test("a state change from an unmounting component's effect cleanup triggers rerenders in newly-created components that use the updated atom or its observers", async () => {
    jest.useFakeTimers()
    const selector = jest.fn(({ get }: AtomGetters) => get(testAtom, ['a']))

    function DyingComponent() {
      const instance = useAtomInstance(testAtom, ['a'])

      // the order of useAtomSelector and this useEffect is important to repro this!
      const val = useAtomSelector(selector)

      useEffect(() => () => {
        instance.set('b')
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
    const selector1 = jest.fn(() => ({ a: 1 })) // two observers; shouldn't rerun
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
      instance.set(undefined)
    })

    jest.runAllTimers()

    expect(div.innerHTML).toBe('undefined')

    act(() => {
      instance.set(1)
    })

    jest.runAllTimers()

    expect(div.innerHTML).toBe('number')

    act(() => {
      instance.set(undefined)
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

    const instance = ecosystem.getNode(selector)

    expect(instance.id).toBe('@selector(testName)-1')
  })

  test('same-name selectors share the namespace when destroyed and recreated at different times', () => {
    const rootAtom = atom('root', () => 1, { ttl: 0 })
    const selector1 = ({ get }: AtomGetters) => get(rootAtom) + 2
    const selector2 = ({ get }: Ecosystem) => get(rootAtom) + 3
    const atom1 = atom('1', () => injectAtomValue(selector1), { ttl: 0 })
    const atom2 = ion('2', ({ get }) => get(selector2), { ttl: 0 })
    const atom3 = atom('3', () => injectAtomSelector(selector1), { ttl: 0 })
    const NAME = 'common-name'

    Object.defineProperty(selector1, 'name', { value: NAME })
    Object.defineProperty(selector2, 'name', { value: NAME })

    let instance1 = ecosystem.getInstance(atom1)
    let instance3 = ecosystem.getInstance(atom3)
    let cleanup1 = instance1.on(() => {}, { active: true })
    let cleanup3 = instance3.on(() => {}, { active: true })

    snapshotNodes()
    expect(instance1.get()).toBe(3)
    expect(instance3.get()).toBe(3)

    cleanup1()
    cleanup3()

    expect(ecosystem.n).toEqual(new Map())

    const instance2 = ecosystem.getNode(atom2)
    const cleanup2 = instance2.on(() => {}, { active: true })

    snapshotNodes()
    expect(instance2.get()).toBe(4)

    instance1 = ecosystem.getInstance(atom1)
    instance3 = ecosystem.getInstance(atom3)
    cleanup1 = instance1.on(() => {}, { active: true })
    cleanup3 = instance3.on(() => {}, { active: true })

    snapshotNodes()
    expect(instance1.get()).toBe(3)
    expect(instance2.get()).toBe(4)
    expect(instance3.get()).toBe(3)

    cleanup2()

    snapshotNodes()
    expect(instance1.get()).toBe(3)
    expect(instance3.get()).toBe(3)

    cleanup1()
    cleanup3()

    expect(ecosystem.n).toEqual(new Map())
  })

  test('injectAtomInstance accepts selectors', () => {
    const atom1 = atom('1', () => 'a')
    const selector1 = ({ get }: Ecosystem, param: string) => get(atom1) + param
    const atom2 = atom('2', () => {
      const instance = injectAtomInstance(selector1, ['b'])

      return instance.get()
    })

    const node2 = ecosystem.getNode(atom2)

    expect(node2.get()).toBe('ab')

    ecosystem.getNode(atom1).set('aa')

    expect(node2.get()).toBe('aab')
  })

  test('ions have ttl: 0 by default', () => {
    const atom1 = atom('1', () => 'a', { ttl: 0 })
    const atom2 = ion('2', ({ get }) => get(atom1))

    const node2 = ecosystem.getNode(atom2)
    const node1 = ecosystem.getNode(atom1)

    expect(node2.status).toBe('Active')

    node2.on(() => {}, { active: true })() // add a dep and immediately remove

    expect(node2.status).toBe('Destroyed')
    expect(node1.status).toBe('Destroyed')
    expect(ecosystem.n.size).toBe(0)
  })
})
