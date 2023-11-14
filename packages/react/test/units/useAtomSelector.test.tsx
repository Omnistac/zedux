import { AtomGetters, atom, useAtomSelector } from '@zedux/react'
import React, { useState } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { ecosystem } from '../utils/ecosystem'
import { act, fireEvent } from '@testing-library/react'

describe('useAtomSelector', () => {
  test('triggers a reevaluation on selector cache force-destruction', async () => {
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
      ecosystem.selectors.destroyCache(selector1, [], true)
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
    expect(selector1).toHaveBeenCalledTimes(2)

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('a')
    expect(selector1).toHaveBeenCalledTimes(4)
  })

  test('useAtomSelector creates/uses a different cache when args change', async () => {
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
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(4)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0-[1]': 1,
    })
  })

  test('useAtomSelector creates/uses a different cache when selector is actually different', async () => {
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
    expect(selector2).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0': 2,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-1-[1]': 1,
    })
  })

  test('useAtomSelector creates/uses a different cache when selector goes from object form to function form', async () => {
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
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0': 1,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(4)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-1': 1,
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
    expect(selector1.selector).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('0')
    expect(selector1.selector).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
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
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0-[0]': 0,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('0')
    expect(selector1).toHaveBeenCalledTimes(4)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-1-[0]': 0,
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
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0': 1,
    })
    expect(renders).toBe(1)

    act(() => {
      fireEvent.click(button)
      ecosystem.selectors.destroyCache(selector1)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(4)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-2': 1,
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

    const cache = ecosystem.selectors.getCache(selector2)
    ecosystem.selectors.addDependent(cache)

    const { findByTestId } = renderInEcosystem(<Test />)

    const button = await findByTestId('button')
    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('2')
    expect(selector1).not.toHaveBeenCalled()
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0': 2,
    })

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('1')
    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-mockConstructor-0': 2,
      // id # 2 'cause `addDependent` generate id 1:
      '@@selector-mockConstructor-2': 1,
    })
  })

  test('inline selectors are swapped out in strict mode double-renders', async () => {
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

    expect(ecosystem.selectors.findAll()).toMatchInlineSnapshot(`
      {
        "@@selector-unnamed-0": SelectorCache {
          "args": [],
          "id": "@@selector-unnamed-0",
          "nextReasons": [],
          "prevReasons": [],
          "result": 1,
          "selectorRef": [Function],
        },
      }
    `)
    expect(div.innerHTML).toBe('10')

    act(() => {
      fireEvent.click(button)
    })

    await Promise.resolve()

    expect(div.innerHTML).toBe('11')

    expect(ecosystem.selectors.findAll()).toMatchInlineSnapshot(`
      {
        "@@selector-unnamed-1": SelectorCache {
          "args": [],
          "id": "@@selector-unnamed-1",
          "nextReasons": [],
          "prevReasons": [],
          "result": 1,
          "selectorRef": [Function],
        },
      }
    `)
  })
})
