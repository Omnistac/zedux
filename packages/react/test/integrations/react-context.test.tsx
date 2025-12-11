import {
  atom,
  AtomProvider,
  inject,
  injectEffect,
  useAtomContext,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Component } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { ecosystem } from '../utils/ecosystem'
import { act } from '@testing-library/react'
import { mockConsole } from '../utils/console'

describe('React context', () => {
  test('a provided atom instance can be consumed dynamically anywhere', async () => {
    const atom1 = atom('1', (param: string) => param)
    let counter = 0

    function Grandchild() {
      const val = useAtomValue(useAtomContext(atom1, true))

      return <div data-testid={counter++}>{val}</div>
    }

    function Child() {
      return <Grandchild />
    }

    function Test() {
      const instance1 = useAtomInstance(atom1, ['a'])
      const instance2 = useAtomInstance(atom1, ['b'])

      return (
        <>
          <AtomProvider instance={instance1}>
            <Child />
          </AtomProvider>
          <AtomProvider instance={instance2}>
            <Child />
          </AtomProvider>
        </>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div1 = await findByTestId('0')
    const div2 = await findByTestId('1')

    expect(div1.innerHTML).toBe('a')
    expect(div2.innerHTML).toBe('b')
  })

  test('multiple instances can be provided at once', async () => {
    const atom1 = atom('1', (param: string) => param)
    const atom2 = atom('2', (param: string) => param)
    let counter = 0

    function Child() {
      const val1 = useAtomValue(useAtomContext(atom1, true))
      const val2 = useAtomValue(useAtomContext(atom2, ['c']))

      return (
        <div data-testid={counter++}>
          {val1}
          {val2}
        </div>
      )
    }

    function Test() {
      const instance1 = useAtomInstance(atom1, ['a'])
      const instance2 = useAtomInstance(atom2, ['b'])

      return (
        <AtomProvider instances={[instance1, instance2]}>
          <Child />
        </AtomProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div1 = await findByTestId('0')

    expect(div1.innerHTML).toBe('ab')
  })

  test('an instance must be provided', async () => {
    const atom1 = atom('1', (param: string) => param)
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    function Child() {
      const val = useAtomValue(useAtomContext(atom1, true))

      return <div data-testid="0">{val}</div>
    }

    function Test() {
      return (
        <>
          {/** @ts-expect-error missing prop */}
          <AtomProvider>
            <Child />
          </AtomProvider>
        </>
      )
    }

    class Boundary extends Component<any, { error: string }> {
      constructor(props: any) {
        super(props)
        this.state = { error: '' }
      }

      static getDerivedStateFromError(error: Error) {
        return { error: error.message }
      }

      render() {
        if (this.state.error) {
          return <div data-testid="1">{this.state.error}</div>
        }

        return this.props.children
      }
    }

    const { findByTestId } = renderInEcosystem(
      <Boundary>
        <Test />
      </Boundary>
    )

    const div = await findByTestId('1')

    expect(div.innerHTML).toMatch(/AtomProvider.*requires.*prop/i)
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockReset()
  })

  test('useAtomContext() can be given default params that are used if no instance was provided', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: string) => id)

    function Test() {
      const instance = useAtomContext(atom1, ['a'])
      const val = useAtomValue(instance)

      return <div data-testid="text">{val}</div>
    }

    const { findByTestId } = renderInEcosystem(<Test />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')

    act(() => {
      ecosystem.getNode(atom1, ['a']).set('aa')
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('aa')
  })

  test('useAtomContext() logs an error if a Destroyed instance was provided', async () => {
    jest.useFakeTimers()
    const mock = mockConsole('error')
    const atom1 = atom('1', (id: string) => id)

    function Child() {
      const instance = useAtomContext(atom1, true)
      const val = useAtomValue(instance)

      return <div data-testid="text">{val}</div>
    }

    function Parent() {
      // useAtomInstance will naturally update the reference on force-destroy
      const instance = ecosystem.getNode(atom1, ['a'])

      return (
        <AtomProvider instance={instance}>
          <Child />
        </AtomProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)

    const div = await findByTestId('text')

    expect(div.innerHTML).toBe('a')
    expect(mock).not.toHaveBeenCalled()

    act(() => {
      ecosystem.getNode(atom1, ['a']).destroy(true)
      jest.runAllTimers()
    })

    expect(div.innerHTML).toBe('a')
    expect(mock).toHaveBeenCalledWith(
      expect.stringMatching(/a destroyed atom instance was provided/i)
    )
  })

  test('useAtomContext() throws an error if 2nd param is true and no instance was provided', async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', (id: string) => id)

    function Test() {
      const instance = useAtomContext(atom1, true)
      const val = useAtomValue(instance)

      return <div data-testid="text">{val}</div>
    }

    const pattern = /no atom instance was provided/i

    expect(() => renderInEcosystem(<Test />)).toThrow(pattern)
  })

  test('useAtomContext with default params flags the context as unsafe before getting the instance', () => {
    const calls: any[] = []

    const atom1 = atom('1', (id: string) => {
      injectEffect(() => {
        calls.push(id)
      })

      return id
    })

    function Test() {
      const instance = useAtomContext(atom1, ['a'])

      return instance.get()
    }

    renderInEcosystem(<Test />)

    expect(calls).toEqual([])
    expect(ecosystem.asyncScheduler.j.length).toEqual(1)

    ecosystem.asyncScheduler.flush()

    expect(calls).toEqual(['a'])
  })

  test('AtomProvider accepts function overloads', async () => {
    const atom1 = atom('1', (id: string) => id)

    function Child() {
      const instance = useAtomContext(atom1, true)
      const val = useAtomValue(instance)

      return <div data-testid="value">{val}</div>
    }

    function Parent() {
      return (
        <AtomProvider instance={ecosystem => ecosystem.getNode(atom1, ['a'])}>
          <AtomProvider
            instances={ecosystem => [
              ecosystem.getNode(atom1, ['b']),
              ecosystem.getNode(atom1, ['c']),
            ]}
          >
            <Child />
          </AtomProvider>
        </AtomProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)
    const div = await findByTestId('value')

    expect(div).toHaveTextContent('c')
  })

  test('AtomProvider prevents the instance from being cleaned up', () => {
    const atom1 = atom('1', () => 1)

    function Child() {
      const instance = useAtomContext(atom1)

      return instance?.get()
    }

    function Parent() {
      return (
        <AtomProvider instance={ecosystem => ecosystem.getNode(atom1)}>
          <Child />
        </AtomProvider>
      )
    }

    renderInEcosystem(<Parent />, { useStrictMode: true })

    const node1 = ecosystem.getNode(atom1)

    expect(node1.o.size).toBe(1)
    expect(ecosystem.viewGraph()).toMatchInlineSnapshot(`
      {
        "1": {
          "observers": [
            {
              "key": "@component(AtomProvider)-:rj:",
              "operation": "useAtomInstance",
            },
          ],
          "sources": [],
          "weight": 1,
        },
        "@component(AtomProvider)-:rj:": {
          "observers": [],
          "sources": [
            {
              "key": "1",
              "operation": "useAtomInstance",
            },
          ],
          "weight": 1,
        },
      }
    `)
  })

  test('AtomProvider function overloads have access to scope', async () => {
    const contextAtom = atom('context', (id: string) => id)

    const scopedAtom = atom('scoped', () => inject(contextAtom))

    function Child() {
      const scopedInstance = useAtomContext(scopedAtom, true)
      const val = useAtomValue(scopedInstance)

      return <div data-testid="value">{val}</div>
    }

    function Parent() {
      return (
        <AtomProvider instance={({ getNode }) => getNode(scopedAtom)}>
          <Child />
        </AtomProvider>
      )
    }

    function Grandparent() {
      return (
        <AtomProvider instance={({ getNode }) => getNode(contextAtom, ['a'])}>
          <Parent />
        </AtomProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Grandparent />)
    const div = await findByTestId('value')

    expect(div).toHaveTextContent('a')
  })
})
