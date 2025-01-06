import { AtomGetters, atom, useAtomSelector } from '@zedux/react'
import React, { useState } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import {
  ecosystem,
  snapshotNodes,
  snapshotSelectorNodes,
} from '../utils/ecosystem'
import { act, fireEvent } from '@testing-library/react'

describe('useAtomSelector', () => {
  test('triggers a reevaluation on selector instance force-destruction', async () => {
    jest.useFakeTimers()
    const a = { a: 1 }
    const b = { a: 2 }
    let obj = a
    const selector1 = () => obj

    function Test() {
      const { a } = useAtomSelector(selector1)

      return <div data-testid="text">{a}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')

    obj = b

    act(() => {
      ecosystem.getNode(selector1, []).destroy(true)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('2')
  })

  test("inline refs are swapped out if the SelectorConfig object's `selector` refs are the same", async () => {
    jest.useFakeTimers()
    const selector1 = jest.fn(() => 'a')

    function Test() {
      const [, setState] = useState(0)
      const val = useAtomSelector({
        selector: selector1,
      })

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')
    expect(selector1).toHaveBeenCalledTimes(1)

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('a')
    expect(selector1).toHaveBeenCalledTimes(2)
  })

  test('useAtomSelector creates/uses a different instance when args change', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: number) => id)
    const selector1 = jest.fn(({ get }: AtomGetters, id: number) =>
      get(atom1, [id])
    )

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(selector1, state)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('0')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[1]': 1,
    })
  })

  test('useAtomSelector creates/uses a different instance when selector is actually different', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: number) => id)
    const selector1 = jest.fn(({ get }: AtomGetters, id: number) =>
      get(atom1, [id])
    )
    const selector2 = jest.fn(() => 2)

    function Test() {
      const [state, setState] = useState(0)
      const val =
        state % 2
          ? useAtomSelector(selector1, state)
          : useAtomSelector(selector2) // yep do it like this

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('2')
    expect(selector1).not.toHaveBeenCalled()
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 2,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-1-[1]': 1,
    })
  })

  test('useAtomSelector creates/uses a different instance when selector goes from object form to function form', async () => {
    jest.useFakeTimers()
    const selector1 = jest.fn(() => 1)

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(
        state % 2 ? selector1 : { selector: selector1 }
      )

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 1,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 1,
    })
  })

  test('argsComparator prevents a selector from running', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: number) => id)
    const selector1 = {
      argsComparator: () => true,
      selector: jest.fn(({ get }: AtomGetters, id: number) => get(atom1, [id])),
    }

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(selector1, state)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('0')
    expect(selector1.selector).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('0')
    expect(selector1.selector).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })
  })

  test('argsComparator does not prevent an inline selector from (re)-running, but the previous args are reused', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: number) => id)
    const selector1 = jest.fn(({ get }: AtomGetters, id: number) =>
      get(atom1, [id])
    )

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(
        {
          argsComparator: () => true,
          selector: selector1,
        },
        state
      )

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('0')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('0')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })
  })

  test('force-destroying a selector after a render is scheduled results in one render', async () => {
    jest.useFakeTimers()
    const selector1 = jest.fn(() => 1)

    let renders = 0

    function Test() {
      const [, setState] = useState(0)
      const val = useAtomSelector({
        argsComparator: () => true,
        selector: selector1,
      })

      renders++

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 1,
    })
    expect(renders).toBe(1)

    act(() => {
      fireEvent.click(button)
      ecosystem.find('@@selector')?.destroy()
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 1,
    })
    expect(renders).toBe(2)
  })

  test('selector is not considered inline if it has multiple dependents', async () => {
    jest.useFakeTimers()
    const selector1 = jest.fn(() => 1)
    const selector2 = jest.fn(() => 2)

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(state % 2 ? selector1 : selector2)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const instance = ecosystem.getNode(selector2)
    instance.on(() => {})

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('2')
    expect(selector1).not.toHaveBeenCalled()
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 2,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-mockConstructor-0': 2,
      // id # 2 'cause `.on` generated id 1:
      '@@selector-mockConstructor-2': 1,
    })
  })

  test('inline selectors are swapped out in strict mode double-renders', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', () => ({ val: 1 }))

    function Test() {
      const [state, setState] = useState(0)
      const val = useAtomSelector(({ get }) => get(atom1).val)

      return (
        <>
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          />
          <div data-testid="text">
            {val}
            {state}
          </div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />, {
      useStrictMode: true,
    })

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    snapshotSelectorNodes()
    expect(div.innerHTML).toBe('10')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('11')

    snapshotSelectorNodes()
  })

  test('inline selector that returns a different object reference every time only triggers one extra rerender (strict mode off)', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', () => ({ val: 1 }))
    let renders = 0

    function Test() {
      renders++
      const { val } = useAtomSelector(({ get }) => ({ val: get(atom1).val }))

      return (
        <>
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')
    expect(renders).toBe(1)
    snapshotNodes()

    act(() => {
      ecosystem.getInstance(atom1).set({ val: 2 })
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('2')
    expect(renders).toBe(2)
    snapshotNodes()
  })

  test('inline selector that returns a different object reference every time only triggers one extra rerender (strict mode on)', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', () => ({ val: 1 }))
    let renders = 0

    function Test() {
      renders++
      const { val } = useAtomSelector(({ get }) => ({ val: get(atom1).val }))

      return (
        <>
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />, {
      useStrictMode: true,
    })

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')
    expect(renders).toBe(4) // 2 rerenders + 2 for strict mode
    snapshotNodes()

    act(() => {
      ecosystem.getInstance(atom1).set({ val: 2 })
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('2')
    expect(renders).toBe(6) // 3 rerenders + 3 for strict mode
    snapshotNodes()
  })

  test('inline selector stays subscribed after being swapped out', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', () => ({ val: 1 }))
    const selector = ({ get }: AtomGetters) => get(atom1)

    function Test() {
      const { val } = useAtomSelector({
        resultsComparator: (a, b) => a.val === b.val,
        selector,
      })

      return (
        <>
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />, {
      useStrictMode: true,
    })

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1')

    act(() => {
      ecosystem.getInstance(atom1).set({ val: 2 })
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('2')

    act(() => {
      ecosystem.getInstance(atom1).set({ val: 3 })
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('3')

    act(() => {
      ecosystem.getInstance(atom1).set({ val: 4 })
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('4')
  })

  test('when a selector is destroyed, other selectors that pass different params to the same ref retain their ids', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', () => '1')
    const selector1 = ({ get }: AtomGetters, str: string) => get(atom1) + str

    function Test() {
      const a = useAtomSelector(selector1, 'a')
      const b = useAtomSelector(selector1, 'b')
      const c = useAtomSelector(selector1, 'c')

      return (
        <div data-testid="text">
          {a}
          {b}
          {c}
        </div>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('1a1b1c')
    expect(ecosystem.dehydrate('@@selector')).toMatchInlineSnapshot(`
      {
        "@@selector-selector1-0-["a"]": "1a",
        "@@selector-selector1-0-["b"]": "1b",
        "@@selector-selector1-0-["c"]": "1c",
      }
    `)

    act(() => {
      ecosystem.getNode(selector1, ['a']).destroy(true)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1a1b1c')
    expect(ecosystem.dehydrate('@@selector')).toMatchInlineSnapshot(`
      {
        "@@selector-selector1-0-["a"]": "1a",
        "@@selector-selector1-0-["b"]": "1b",
        "@@selector-selector1-0-["c"]": "1c",
      }
    `)
  })
})
