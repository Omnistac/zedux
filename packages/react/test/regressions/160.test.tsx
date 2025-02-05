import {
  atom,
  AtomGetters,
  AtomProvider,
  NodeOf,
  useAtomContext,
  useAtomInstance,
  useAtomSelector,
} from '@zedux/react'
import React from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('issue #160', () => {
  test('repro', async () => {
    const configAtom = atom('config', {
      controls: [
        {
          counter: 0,
          id: '1',
        },
        {
          counter: 0,
          id: '2',
        },
      ],
    })

    const useConfigAtomContext = () => useAtomContext(configAtom, true)

    const useConfigAtomItems = (instance: NodeOf<typeof configAtom>) =>
      instance.get().controls ?? []

    const selector = (
      { get }: AtomGetters,
      instance: NodeOf<typeof configAtom>,
      id: string
    ) => get(instance).controls.find(t => t.id === id)

    function Item({ id }: { id: string }) {
      const instance = useConfigAtomContext()
      const thisItem = useAtomSelector(selector, instance, id)

      return <div data-testid={`item${id}`}>{thisItem?.counter}</div>
    }

    function Menu() {
      const instance = useConfigAtomContext()
      const items = useConfigAtomItems(instance)

      return (
        <div>
          Menu: {instance.get().controls[0].counter}
          <ul>
            {items?.map(item => (
              <Item key={item.id} id={item.id} />
            ))}
          </ul>
        </div>
      )
    }

    function Content() {
      const instance = useConfigAtomContext()
      const items = useConfigAtomItems(instance)

      return (
        <div>
          <span data-testid="content">
            {instance.get().controls[0].counter}
          </span>
          <ul>
            {items?.map(item => (
              <Item key={item.id} id={item.id} />
            ))}
          </ul>
        </div>
      )
    }

    function Outlet() {
      const instance = useConfigAtomContext()

      return (
        <div>
          <div>Outlet: {instance.get().controls[0].counter}</div>
          <Menu />
          <Content />
        </div>
      )
    }

    function App() {
      const instance = useAtomInstance(configAtom)

      return (
        <AtomProvider instance={instance}>
          <Outlet />
        </AtomProvider>
      )
    }

    const { findByTestId, findAllByTestId } = renderInEcosystem(<App />, {
      useStrictMode: true,
    })

    const content = await findByTestId('content')

    expect(content.innerHTML).toBe('0')

    const items1 = await findAllByTestId('item1')
    const items2 = await findAllByTestId('item2')

    expect(items1[0].innerHTML).toBe('0')
    expect(items1[1].innerHTML).toBe('0')
    expect(items2[0].innerHTML).toBe('0')
    expect(items2[1].innerHTML).toBe('0')
  })
})
