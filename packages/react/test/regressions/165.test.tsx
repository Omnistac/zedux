import {
  atom,
  AtomGetters,
  useAtomSelector,
  useAtomState,
  useAtomValue,
} from '@zedux/react'
import React from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { act } from '@testing-library/react'
import { ecosystem } from '../utils/ecosystem'

const itemsAtom = atom('items', [{ id: 1 }])
const exampleAtom = atom('example', 'a')
const selector = ({ get }: AtomGetters) => get(exampleAtom)

let isUsingSelectors = false

function Item({ id }: { id: number }) {
  const exampleValue = isUsingSelectors
    ? useAtomSelector(selector)
    : useAtomValue(exampleAtom)

  return <div data-testid={`item${id}`}>{exampleValue}</div>
}

function List() {
  const [items, setItems] = useAtomState(itemsAtom)
  const exampleValue = isUsingSelectors
    ? useAtomSelector(selector)
    : useAtomValue(exampleAtom)

  return (
    <div>
      <div data-testid="list">{exampleValue}</div>
      <ul>
        {items.map(item => (
          <Item key={item.id} id={item.id} />
        ))}
      </ul>
      <button
        data-testid="addItem"
        onClick={() => setItems(items => [...items, { id: items.length + 1 }])}
      >
        Add Item
      </button>
    </div>
  )
}

describe('issue #165', () => {
  test('atoms in strict mode', async () => {
    // These should only happen in React 18, which Zedux v2 no longer supports
    // ;(globalThis as any).useReact18UseId()
    isUsingSelectors = false

    const { findByTestId } = renderInEcosystem(<List />, {
      useStrictMode: true,
    })
    const button = await findByTestId('addItem')
    const list = await findByTestId('list')
    const item1 = await findByTestId('item1')

    expect(list).toHaveTextContent('a')
    expect(item1).toHaveTextContent('a')

    act(() => {
      button.click()
    })

    const item2 = await findByTestId('item2')

    expect(item2).toHaveTextContent('a')

    act(() => {
      ecosystem.getInstance(exampleAtom).set('aa')
    })

    expect(list).toHaveTextContent('aa')
    expect(item1).toHaveTextContent('aa')
    expect(item2).toHaveTextContent('aa')
  })

  test('atoms without strict mode', async () => {
    // These should only happen in React 18, which Zedux v2 no longer supports
    // ;(globalThis as any).useReact18UseId()
    isUsingSelectors = false

    const { findByTestId } = renderInEcosystem(<List />)
    const button = await findByTestId('addItem')
    const list = await findByTestId('list')
    const item1 = await findByTestId('item1')

    expect(list).toHaveTextContent('a')
    expect(item1).toHaveTextContent('a')

    act(() => {
      button.click()
    })

    const item2 = await findByTestId('item2')

    expect(item2).toHaveTextContent('a')

    act(() => {
      ecosystem.getInstance(exampleAtom).set('aa')
    })

    expect(list).toHaveTextContent('aa')
    expect(item1).toHaveTextContent('aa')
    expect(item2).toHaveTextContent('aa')
  })

  test('selectors in strict mode', async () => {
    // These should only happen in React 18, which Zedux v2 no longer supports
    // ;(globalThis as any).useReact18UseId()
    isUsingSelectors = true

    const { findByTestId } = renderInEcosystem(<List />, {
      useStrictMode: true,
    })
    const button = await findByTestId('addItem')
    const list = await findByTestId('list')
    const item1 = await findByTestId('item1')

    expect(list).toHaveTextContent('a')
    expect(item1).toHaveTextContent('a')

    act(() => {
      button.click()
    })

    const item2 = await findByTestId('item2')

    expect(item2).toHaveTextContent('a')

    act(() => {
      ecosystem.getInstance(exampleAtom).set('aa')
    })

    expect(list).toHaveTextContent('aa')
    expect(item1).toHaveTextContent('aa')
    expect(item2).toHaveTextContent('aa')
  })

  test('selectors without strict mode', async () => {
    // These should only happen in React 18, which Zedux v2 no longer supports
    // ;(globalThis as any).useReact18UseId()
    isUsingSelectors = true

    const { findByTestId } = renderInEcosystem(<List />)
    const button = await findByTestId('addItem')
    const list = await findByTestId('list')
    const item1 = await findByTestId('item1')

    expect(list).toHaveTextContent('a')
    expect(item1).toHaveTextContent('a')

    act(() => {
      button.click()
    })

    const item2 = await findByTestId('item2')

    expect(item2).toHaveTextContent('a')

    act(() => {
      ecosystem.getInstance(exampleAtom).set('aa')
    })

    expect(list).toHaveTextContent('aa')
    expect(item1).toHaveTextContent('aa')
    expect(item2).toHaveTextContent('aa')
  })
})
