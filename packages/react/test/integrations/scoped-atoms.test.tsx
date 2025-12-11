import {
  api,
  atom,
  AtomProvider,
  Ecosystem,
  inject,
  injectAtomValue,
  injectCallback,
  injectEcosystem,
  NodeOf,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { createContext, useState } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { ecosystem } from '../utils/ecosystem'
import { act } from '@testing-library/react'
import { expectTypeOf } from 'expect-type'
import { mockConsole } from '../utils/console'

describe('scoped atoms', () => {
  test('read provided atoms', async () => {
    const parentAtom = atom('parent', () => 1)

    const childAtom = atom('child', () => {
      const instance = inject(parentAtom)

      expectTypeOf(instance).toEqualTypeOf<NodeOf<typeof parentAtom>>()

      return instance
    })

    function Child() {
      const childVal = useAtomValue(childAtom)

      return <div data-testid="child">{childVal}</div>
    }

    function Parent() {
      const parentInstance = useAtomInstance(parentAtom)

      return (
        <AtomProvider instance={parentInstance}>
          <Child />
        </AtomProvider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)
    const child = await findByTestId('child')

    expect(child).toHaveTextContent('1')

    act(() => {
      ecosystem.getNode(parentAtom).set(2)
    })

    expect(child).toHaveTextContent('2')
  })

  test('read provided React context values', async () => {
    const context = createContext(1)

    const childAtom = atom('child', () => {
      const value = inject(context)

      expectTypeOf(value).toEqualTypeOf<number>()

      return value
    })

    function Child() {
      const childVal = useAtomValue(childAtom)

      return <div data-testid="child">{childVal}</div>
    }

    function Parent() {
      const [state, setState] = useState(1)

      return (
        <context.Provider value={state}>
          <Child />
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          >
            Update
          </button>
        </context.Provider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)
    const button = await findByTestId('button')
    const child = await findByTestId('child')

    expect(child).toHaveTextContent('1')

    act(() => {
      button.click()
    })

    expect(child).toHaveTextContent('2')
  })

  test('when a scoped atom is provided different values, creates a new instance with a scoped id', async () => {
    const calls: any[] = []
    const context = createContext('a')
    const parentAtom = atom('parent', (initialValue: number) => initialValue)

    const nestedContextualAtom = atom('nested', () => {
      const parentInstance = inject(parentAtom)

      return parentInstance.get()
    })

    const childAtom = atom(
      'child',
      () => {
        const reactValue = inject(context)
        const parentInstance = inject(parentAtom)
        const nestedContextualValue = injectAtomValue(nestedContextualAtom)

        expectTypeOf(reactValue).toEqualTypeOf<string>()
        expectTypeOf(parentInstance).toEqualTypeOf<NodeOf<typeof parentAtom>>()

        return `${reactValue}${parentInstance.get()} ${nestedContextualValue}`
      },
      { ttl: 0 }
    )

    function Child() {
      const childVal = useAtomValue(childAtom)

      calls.push(childVal)

      return <div data-testid="child">{childVal}</div>
    }

    function Parent() {
      const [state1, setState1] = useState('a')
      const instance1 = useAtomInstance(parentAtom, [1])
      const instance2 = useAtomInstance(parentAtom, [2])

      // 4 pairs: context1+atom1, context1+atom2, context2+atom1, context2+atom2
      return (
        <>
          {[state1, 'b'].map((value, index) => (
            <context.Provider key={index} value={value}>
              {[instance1, instance2].map(instance => (
                <AtomProvider key={instance.id} instance={instance}>
                  <Child />
                </AtomProvider>
              ))}
            </context.Provider>
          ))}
          <button
            data-testid="button1"
            onClick={() => setState1(state => state + 'a')}
          >
            Update 1
          </button>
        </>
      )
    }

    const { findAllByTestId, findByTestId } = renderInEcosystem(<Parent />)
    const button1 = await findByTestId('button1')
    const children = await findAllByTestId('child')

    expect(children[0]).toHaveTextContent('a1 1')
    expect(children[1]).toHaveTextContent('a2 2')
    expect(children[2]).toHaveTextContent('b1 1')
    expect(children[3]).toHaveTextContent('b2 2')

    expect(calls).toEqual(['a1 1', 'a2 2', 'b1 1', 'b2 2'])
    calls.splice(0, calls.length)

    // 2 parents, 4 providers, 4 children, 2 nested, 6 external
    expect(ecosystem.n.size).toBe(18)

    expect(ecosystem.findAll('@atom').map(({ id }) => id)).toEqual([
      'child-@scope("a",parent-[1])',
      'child-@scope("a",parent-[2])',
      'child-@scope("b",parent-[1])',
      'child-@scope("b",parent-[2])',
      'nested-@scope(parent-[1])',
      'nested-@scope(parent-[2])',
      'parent-[1]',
      'parent-[2]',
    ])

    act(() => {
      button1.click()
    })

    expect(children[0]).toHaveTextContent('aa1 1')
    expect(children[1]).toHaveTextContent('aa2 2')
    expect(children[2]).toHaveTextContent('b1 1')
    expect(children[3]).toHaveTextContent('b2 2')

    expect(calls).toEqual(['aa1 1', 'aa2 2', 'b1 1', 'b2 2'])
    calls.splice(0, calls.length)

    expect(ecosystem.n.size).toBe(18) // 2 new children, 2 destroyed

    expect(ecosystem.findAll('@atom').map(({ id }) => id)).toEqual([
      'child-@scope("aa",parent-[1])',
      'child-@scope("aa",parent-[2])',
      'child-@scope("b",parent-[1])',
      'child-@scope("b",parent-[2])',
      'nested-@scope(parent-[1])',
      'nested-@scope(parent-[2])',
      'parent-[1]',
      'parent-[2]',
    ])

    act(() => {
      ecosystem.getNode(parentAtom, [1]).set(11)
    })

    expect(children[0]).toHaveTextContent('aa11 11')
    expect(children[1]).toHaveTextContent('aa2 2')
    expect(children[2]).toHaveTextContent('b11 11')
    expect(children[3]).toHaveTextContent('b2 2')

    // atoms = fewer rerenders :muscle:
    expect(calls).toEqual(['aa11 11', 'b11 11'])
    calls.splice(0, calls.length)

    expect(ecosystem.n.size).toBe(18) // no changes

    expect(ecosystem.findAll('@atom').map(({ id }) => id)).toEqual([
      'child-@scope("aa",parent-[1])',
      'child-@scope("aa",parent-[2])',
      'child-@scope("b",parent-[1])',
      'child-@scope("b",parent-[2])',
      'nested-@scope(parent-[1])',
      'nested-@scope(parent-[2])',
      'parent-[1]',
      'parent-[2]',
    ])
  })

  test('scoped nodes propagate scope recursively to all observers', async () => {
    const calls: any[] = []
    const context = createContext('a')
    const parentAtom1 = atom('parent1', (initialValue: number) => initialValue)
    const parentAtom2 = atom('parent2', (initialValue: number) => initialValue)

    const topSource = atom(
      'topSource',
      () => {
        const parentInstance1 = inject(parentAtom1)
        const reactValue = inject(context)

        return reactValue + parentInstance1.get()
      },
      { ttl: 0 }
    )

    const middleSource = atom(
      'middleSource',
      () => {
        const parentInstance2 = inject(parentAtom2)

        return `${injectAtomValue(topSource)} ${parentInstance2.get()}`
      },
      { ttl: 0 }
    )

    const bottomSource = ({ get }: Ecosystem) => get(middleSource)

    const childAtom = atom(
      'child',
      () => {
        const value = injectAtomValue(bottomSource)

        expectTypeOf(value).toEqualTypeOf<string>()
        calls.push(value)

        return value
      },
      { ttl: 0 }
    )

    function Child() {
      const childVal = useAtomValue(childAtom)

      return <div data-testid="child">{childVal}</div>
    }

    function Parent() {
      const [state1, setState1] = useState('a')
      const instance1 = useAtomInstance(parentAtom1, [1])
      const instance100 = useAtomInstance(parentAtom1, [100])
      const instance2 = useAtomInstance(parentAtom2, [2])
      const instance200 = useAtomInstance(parentAtom2, [200])

      /**
       * 4 triplets:
       *
       * - contextA+instance1+instance2
       * - contextA+instance100+instance200
       * - contextB+instance1+instance2
       * - contextB+instance100+instance200
       */
      return (
        <>
          {[state1, 'b'].map((value, index) => (
            <context.Provider key={index} value={value}>
              {[
                [instance1, instance2],
                [instance100, instance200],
              ].map(([instanceA, instanceB]) => (
                <AtomProvider key={instanceA.id} instance={instanceA}>
                  <AtomProvider key={instanceB.id} instance={instanceB}>
                    <Child />
                  </AtomProvider>
                </AtomProvider>
              ))}
            </context.Provider>
          ))}
          <button
            data-testid="button1"
            onClick={() => setState1(state => state + 'a')}
          >
            Update 1
          </button>
        </>
      )
    }

    const { findAllByTestId, findByTestId } = renderInEcosystem(<Parent />)
    const button1 = await findByTestId('button1')
    const children = await findAllByTestId('child')

    expect(children[0]).toHaveTextContent('a1 2')
    expect(children[1]).toHaveTextContent('a100 200')
    expect(children[2]).toHaveTextContent('b1 2')
    expect(children[3]).toHaveTextContent('b100 200')

    expect(calls).toEqual(['a1 2', 'a100 200', 'b1 2', 'b100 200'])
    calls.splice(0, calls.length)

    // 4 parents, 8 providers, 4 children, 4 nested, 4 middle, 4 top, 8 external
    expect(ecosystem.n.size).toBe(36)

    expect(
      ecosystem.findAll(['@atom', '@selector']).map(({ id }) => id)
    ).toMatchSnapshot()

    act(() => {
      button1.click()
    })

    expect(children[0]).toHaveTextContent('aa1 2')
    expect(children[1]).toHaveTextContent('aa100 200')
    expect(children[2]).toHaveTextContent('b1 2')
    expect(children[3]).toHaveTextContent('b100 200')

    expect(calls).toEqual(['aa1 2', 'aa100 200'])
    calls.splice(0, calls.length)

    // 4 parents, 8 providers, 4 children, 4 nested, 4 middle, 4 top, 8 external
    expect(ecosystem.n.size).toBe(36)

    expect(
      ecosystem.findAll(['@atom', '@selector']).map(({ id }) => id)
    ).toMatchSnapshot()

    const scope = new Map<Record<string, any>, any>([
      [context, 'b'],
      [parentAtom1, ecosystem.getNode(parentAtom1, [1])],
      [parentAtom2, ecosystem.getNode(parentAtom2, [2])],
    ])

    const childInstance = ecosystem.withScope(scope, () =>
      ecosystem.getNode(childAtom)
    )

    act(() => {
      childInstance.invalidate()
    })

    expect(calls).toEqual(['b1 2'])
    calls.splice(0, calls.length)

    // 4 parents, 8 providers, 4 children, 4 nested, 4 middle, 4 top, 8 external
    expect(ecosystem.n.size).toBe(36)

    expect(
      ecosystem.findAll(['@atom', '@selector']).map(({ id }) => id)
    ).toMatchSnapshot()

    act(() => {
      childInstance.destroy(true)
    })

    expect(calls).toEqual(['b1 2'])
    calls.splice(0, calls.length)

    // 4 parents, 8 providers, 4 children, 4 nested, 4 middle, 4 top, 8 external
    expect(ecosystem.n.size).toBe(36)

    expect(
      ecosystem.findAll(['@atom', '@selector']).map(({ id }) => id)
    ).toMatchSnapshot()
  })

  test('React context reference changes create new scopes', async () => {
    const calls: any[] = []
    const context = createContext({ a: { b: 1 } })

    const childAtom = atom('child', () => {
      const value = inject(context)

      expectTypeOf(value).toEqualTypeOf<{ a: { b: number } }>()
      calls.push(value)

      return value
    }) // no ttl

    function Child() {
      const childVal = useAtomValue(({ get }) => get(childAtom))

      return <div data-testid="child">{childVal.a.b}</div>
    }

    function Parent() {
      const [state, setState] = useState(1)

      return (
        <context.Provider value={{ a: { b: state } }}>
          <Child />
          <button
            data-testid="button"
            onClick={() => setState(state => state + 1)}
          >
            Update
          </button>
        </context.Provider>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)
    const button = await findByTestId('button')
    const child = await findByTestId('child')

    expect(child).toHaveTextContent('1')
    expect(calls).toEqual([{ a: { b: 1 } }])
    calls.splice(0, calls.length)

    expect(ecosystem.findAll().map(({ id }) => id)).toEqual([
      expect.stringContaining('@component(Child)'),
      '@selector(unknown)-1-@scope({"a":{"b":1}})',
      'child-@scope({"a":{"b":1}})',
    ])

    act(() => {
      button.click()
    })

    expect(child).toHaveTextContent('2')
    expect(calls).toEqual([{ a: { b: 2 } }])

    expect(ecosystem.findAll().map(({ id }) => id)).toEqual([
      expect.stringContaining('@component(Child)'),
      '@selector(unknown)-1-@scope({"a":{"b":1}})',
      'child-@scope({"a":{"b":1}})',
      'child-@scope({"a":{"b":2}})',
    ])
  })

  test('when a value is not provided, the thrown error attaches the requested context object', async () => {
    const consoleMock = mockConsole('error')
    const context = createContext<undefined | string>(undefined)
    const atom1 = atom('1', () => 'a')
    const childAtom1 = atom('child', () => inject(context))
    const childAtom2 = atom('child', () => inject(atom1))

    function Child1() {
      const childVal = useAtomValue(childAtom1)

      return <div data-testid="child">{childVal}</div>
    }

    function Child2() {
      const childVal = useAtomValue(childAtom2)

      return <div data-testid="child">{childVal}</div>
    }

    let error: Error | undefined = undefined

    try {
      renderInEcosystem(<Child1 />)
    } catch (err) {
      error = err as Error
    }

    expect(error?.message).toMatch(
      /Value was not provided to scoped atom. See attached cause/
    )
    expect(error?.cause).toBe(context)
    expect(consoleMock).toHaveBeenCalledTimes(2) // both Zedux and React log it

    try {
      renderInEcosystem(<Child2 />)
    } catch (err) {
      error = err as Error
    }

    expect(error?.message).toMatch(
      /Value was not provided to scoped atom. See attached cause/
    )
    expect(error?.cause).toBe(atom1)
    expect(consoleMock).toHaveBeenCalledTimes(4)
  })

  test('scoped atoms throw an error when retrieved outside a scoped context', () => {
    const consoleMock = mockConsole('error')
    const atom1 = atom('1', () => 'a')
    const childAtom = atom('child', () => inject(atom1))

    expect(() => ecosystem.getNode(childAtom)).toThrow(
      /Scoped atom was used outside a scoped context/
    )
    expect(consoleMock).toHaveBeenCalledTimes(1)
  })

  test('scopes are recursive', () => {
    const context1 = atom('context1', () => 'a')
    const context2 = atom('context2', () => 'b')
    const context3 = atom('context3', () => 'c')

    const scope1 = [ecosystem.getNode(context1)]
    const scope2 = new Map([[context2, ecosystem.getNode(context2)]])
    const scope3 = [ecosystem.getNode(context3)]

    const scoped1 = atom('scoped1', () => inject(context1))
    const scoped2 = atom('scoped2', () => inject(context2))
    const scoped3 = atom('scoped3', () => inject(context3))

    const result1 = ecosystem.withScope(scope1, () => {
      const node1 = ecosystem.getNode(scoped1)

      const result2 = ecosystem.withScope(scope2, () => {
        const node1 = ecosystem.getNode(scoped1) // looks in outer scope
        const node2 = ecosystem.getNode(scoped2)

        const result3 = ecosystem.withScope(scope3, () => {
          const node1 = ecosystem.getNode(scoped1) // looks in outer outer scope
          const node2 = ecosystem.getNode(scoped2) // looks in outer scope
          const node3 = ecosystem.getNode(scoped3)

          return node1.get() + node2.get() + node3.get()
        })

        return `${node1.get() + node2.get()} ${result3}`
      })

      return `${node1.get()} ${result2}`
    })

    expect(result1).toBe('a ab abc')
  })

  test('scoped atoms are not hydrated', () => {
    const calls: any[] = []
    const context1 = atom('context1', () => 'a')
    const scope1 = [ecosystem.getNode(context1)]

    const scoped1 = atom('scoped1', () => {
      const val = inject(context1).get()

      calls.push(val)

      return val
    })

    const expectedId = 'scoped1-@scope(context1)'
    const hydration = { [expectedId]: 'b' }

    ecosystem.hydrate(hydration)

    const scopedNode1 = ecosystem.withScope(scope1, () =>
      ecosystem.getNode(scoped1)
    )

    expect(scopedNode1.get()).toBe('a')
    expect(ecosystem.hydration).toEqual(hydration)
    expect(scopedNode1.id).toBe(expectedId)
    expect(calls).toEqual(['a'])
  })

  test('ecosystem cycle event listeners receive the fully-scoped id when the node becomes Active', () => {
    jest.useFakeTimers()
    const calls: any[] = []
    const context1 = atom('context1', () => 'a')
    const scope1 = [ecosystem.getNode(context1)]

    const scoped1 = atom('scoped1', () => {
      const val = inject(context1).get()

      calls.push(val)

      return val
    })

    const expectedId = 'scoped1-@scope(context1)'

    ecosystem.on('cycle', event => {
      calls.push([event.source?.id, event.newStatus])
    })

    const scopedNode1 = ecosystem.withScope(scope1, () =>
      ecosystem.getNode(scoped1)
    )

    jest.runAllTimers()

    expect(scopedNode1.get()).toBe('a')
    expect(calls).toEqual(['a', [expectedId, 'Active']])
  })

  test('exports and injectCallback capture scope and wrap the passed function in it', () => {
    const contextAtom = atom('context', () => 'a')
    const scopedAtom = atom('scoped', () => inject(contextAtom))

    const atom1 = atom('1', () => {
      const ecosystem = injectEcosystem()
      const val = ecosystem.get(scopedAtom)

      const callback1 = injectCallback(() => ecosystem.get(scopedAtom))

      return api(val).setExports({
        callback1,
        callback2: () => ecosystem.get(scopedAtom),
      })
    })

    const node1 = ecosystem.withScope([ecosystem.getNode(contextAtom)], () =>
      ecosystem.getNode(atom1)
    )

    expect(node1.get()).toBe('a')
    expect(node1.exports.callback1()).toBe('a')
    expect(node1.exports.callback2()).toBe('a')
  })

  test('scope is only captured if not `wrap: false`', () => {
    const mock = mockConsole('error')
    const contextAtom = atom('context', () => 'a')
    const scopedAtom = atom('scoped', () => inject(contextAtom))

    const atom1 = atom('1', () => {
      const ecosystem = injectEcosystem()
      const val = ecosystem.get(scopedAtom)

      const callback1 = injectCallback(() => ecosystem.get(scopedAtom))

      return api(val)
        .setExports({
          callback1,
        })
        .addExports(
          {
            callback2: () => ecosystem.get(scopedAtom),
          },
          { wrap: false }
        )
    })

    const scope = [ecosystem.getNode(contextAtom)]

    const node1 = ecosystem.withScope(scope, () => ecosystem.getNode(atom1))

    expect(node1.get()).toBe('a')
    expect(node1.exports.callback1()).toBe('a')
    expect(() => node1.exports.callback2()).toThrow(
      /Scoped atom was used outside a scoped context/
    )
    expect(ecosystem.withScope(scope, () => node1.exports.callback2())).toBe(
      'a'
    )
    expect(mock).toHaveBeenCalledTimes(1)
  })

  test('`AtomTemplate#getNodeId` can return scoped strings', () => {
    const template = atom('1', (id?: string) => id)

    const scope = new Map<Record<string, any>, any>([[template, 'b']])

    expect(template.getNodeId(ecosystem, [], { scope })).toBe('1-@scope("b")')

    expect(template.getNodeId(ecosystem, ['a'], { scope })).toBe(
      '1-["a"]-@scope("b")'
    )

    scope.set({}, 'c')

    expect(template.getNodeId(ecosystem, ['a'], { scope })).toBe(
      '1-["a"]-@scope("b","c")'
    )
  })
})
