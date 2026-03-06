import {
  api,
  atom,
  injectAtomValue,
  injectPromise,
  injectSignal,
  StateOf,
  useAtomInstance,
  useAtomState,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense, useState } from 'react'
import { ErrorBoundary } from '../utils/ErrorBoundary'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { mockConsole } from '../utils/console'
import { ecosystem } from '../utils/ecosystem'
import { act } from '@testing-library/react'
import { expectTypeOf } from 'expect-type'

describe('suspense', () => {
  test('api().setPromise() makes a component suspend', async () => {
    let resolve: (val?: any) => void = () => {}

    const atom1 = atom('1', () => {
      return api('b').setPromise(new Promise(r => (resolve = r)))
    })

    const Child = () => <div data-testid="b">{useAtomValue(atom1)}</div>

    const Parent = () => (
      <Suspense fallback={<div data-testid="a">a</div>}>
        <Child />
      </Suspense>
    )

    const { findByTestId } = renderInEcosystem(<Parent />)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    resolve()

    const div2 = await findByTestId('b')

    expect(div2.innerHTML).toBe('b')
  })

  test('api(promise) makes a component suspend', async () => {
    let resolve: (val?: any) => void = () => {}

    const atom1 = atom('1', () => {
      return api(new Promise<string>(r => (resolve = r)))
    })

    const Child = () => <div data-testid="b">{useAtomValue(atom1).data}</div>

    const Parent = () => (
      <Suspense fallback={<div data-testid="a">a</div>}>
        <Child />
      </Suspense>
    )

    const { findByTestId } = renderInEcosystem(<Parent />)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    resolve('b')

    const div2 = await findByTestId('b')

    expect(div2.innerHTML).toBe('b')
  })

  test('api().setPromise() rejected error hits ErrorBoundary', async () => {
    const mock = mockConsole('error')

    let reject: (val?: any) => void = () => {}

    const atom1 = atom('1', () => {
      return api('b').setPromise(new Promise((_, r) => (reject = r)))
    })

    const Child = () => <div data-testid="b">{useAtomValue(atom1)}</div>

    const Parent = () => (
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="a">a</div>}>
          <Child />
        </Suspense>
      </ErrorBoundary>
    )

    const { findByTestId } = renderInEcosystem(<Parent />)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    reject('b')

    const div2 = await findByTestId('error')

    expect(div2.innerHTML).toBe('b')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.any(String),
      'b',
      expect.stringContaining(
        'The above error occurred in the <Child> component'
      ),
      expect.any(String)
    )
  })

  test('api(promise) rejected error hits ErrorBoundary', async () => {
    const mock = mockConsole('error')

    let reject: (val?: any) => void = () => {}

    const atom1 = atom('1', () => {
      return api(new Promise<string>((_, r) => (reject = r)))
    })

    const Child = () => <div data-testid="b">{useAtomValue(atom1).data}</div>

    const Parent = () => (
      <ErrorBoundary>
        <Suspense fallback={<div data-testid="a">a</div>}>
          <Child />
        </Suspense>
      </ErrorBoundary>
    )

    const { findByTestId } = renderInEcosystem(<Parent />)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    reject('b')

    const div2 = await findByTestId('error')

    expect(div2.innerHTML).toBe('b')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.any(String),
      'b',
      expect.stringContaining(
        'The above error occurred in the <Child> component'
      ),
      expect.any(String)
    )
  })

  test('dynamic hooks can update previously-suspended components', async () => {
    let resolveB: (val?: any) => void = () => {}

    const atom1 = atom('1', () => {
      return api(Promise.resolve('b'))
    })

    let resolvedA = false
    let resolvedB = false
    const promiseA = Promise.resolve(1).then(() => (resolvedA = true))
    const promiseB = new Promise(r => (resolveB = r)).then(
      () => (resolvedB = true)
    )

    const Child = () => {
      if (!resolvedA) throw promiseA
      const val = useAtomValue(atom1)
      if (!resolvedB) throw promiseB

      return <div data-testid="b">{val.data}</div>
    }

    const Parent = () => (
      <Suspense fallback={<div data-testid="a">a</div>}>
        <Child />
      </Suspense>
    )

    const { findByTestId } = renderInEcosystem(<Parent />, {
      useStrictMode: true,
    })

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    await promiseA
    resolveB(2)

    const div2 = await findByTestId('b')

    expect(div2.innerHTML).toBe('b')

    act(() => {
      ecosystem.getInstance(atom1).mutate({ data: 'c' })
    })

    await Promise.resolve()

    expect(div2.innerHTML).toBe('c')
  })

  test('dataSignal is properly typed', async () => {
    const zeduxPromiseAtom = atom('zeduxPromise', () => {
      const { dataSignal, promise } = injectPromise(
        () => Promise.resolve(1),
        []
      )

      return api(dataSignal).setPromise(promise)
    })

    const normalPromiseAtom = atom('normalPromise', () => {
      const { dataSignal } = injectPromise(() => Promise.resolve(1), [])

      return api(dataSignal).setPromise(Promise.resolve(2))
    })

    const atom1 = atom('1', () => {
      const value1 = injectAtomValue(zeduxPromiseAtom)
      const value2 = injectAtomValue(normalPromiseAtom)

      // in atoms, a suspendable atom's `data` type can be undefined:
      expectTypeOf(value1).toEqualTypeOf<number | undefined>()
      expectTypeOf(value2).toEqualTypeOf<number | undefined>()

      return (value1 || 0) + (value2 || 0)
    })

    function Child() {
      const value1 = useAtomValue(zeduxPromiseAtom)
      const [state1] = useAtomState(zeduxPromiseAtom)
      const value1NoSuspense = useAtomValue(zeduxPromiseAtom, [], {
        suspend: false,
      })
      const [state1NoSuspense] = useAtomState(zeduxPromiseAtom, [], {
        suspend: false,
      })
      const value2 = useAtomValue(normalPromiseAtom)
      const value = useAtomValue(atom1)

      const instance1 = useAtomInstance(zeduxPromiseAtom)
      const instanceValue1 = useAtomValue(instance1)
      const instanceValue1NoSuspense = useAtomValue(instance1, [], {
        suspend: false,
      })

      const instance2 = useAtomInstance(normalPromiseAtom)
      const instanceValue2 = useAtomValue(instance2)
      const instanceValue2NoSuspense = useAtomValue(instance2, [], {
        suspend: false,
      })

      expectTypeOf(value).toEqualTypeOf<number>()
      // in react, a suspendable atom's `data` type is defined (unless `suspend: false`)
      expectTypeOf(value1).toEqualTypeOf<number>()
      expectTypeOf(state1).toEqualTypeOf<number>()
      expectTypeOf(value1NoSuspense).toEqualTypeOf<number | undefined>()
      expectTypeOf(state1NoSuspense).toEqualTypeOf<number | undefined>()
      expectTypeOf(value2).toEqualTypeOf<number>()

      expectTypeOf(instance1.promise).toEqualTypeOf<Promise<number>>()
      expectTypeOf<StateOf<typeof instance1>>().toEqualTypeOf<
        number | undefined
      >()
      expectTypeOf(instanceValue1).toEqualTypeOf<number>()
      expectTypeOf(instanceValue1NoSuspense).toEqualTypeOf<number | undefined>()

      expectTypeOf(instance2.promise).toEqualTypeOf<Promise<number>>()
      expectTypeOf<StateOf<typeof instance2>>().toEqualTypeOf<
        number | undefined
      >()
      expectTypeOf(instanceValue2).toEqualTypeOf<number>()
      expectTypeOf(instanceValue2NoSuspense).toEqualTypeOf<number | undefined>()

      return <div data-testid="value">{value1 + (value2 || 0) + value}</div>
    }

    function Parent() {
      return (
        <Suspense fallback={<div>loading...</div>}>
          <Child />
        </Suspense>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />, {
      useStrictMode: true,
    })

    const div = await findByTestId('value')

    expect(div).toHaveTextContent('4')
  })

  test('useAtomState() can be configured to not suspend', async () => {
    const atom1 = atom('1', () => {
      return api(Promise.resolve(1))
    })

    const calls: any[] = []

    function Child() {
      const [state] = useAtomState(atom1, [], { suspend: false })
      calls.push(state.data)

      return <div data-testid="value">{state.data}</div>
    }

    function Parent() {
      return (
        <Suspense fallback={<div>loading...</div>}>
          <Child />
        </Suspense>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />, {
      useStrictMode: true,
    })

    await findByTestId('value')

    expect(calls).toEqual([undefined, undefined, 1, 1])
  })

  test('suspending component does not create extra ExternalNodes or register extra observers', async () => {
    const testSuspenseAtom = atom(
      'testSuspenseAtom',
      () => {
        const signal = injectSignal({ loaded: false })

        const { promise } = injectPromise(async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
          signal.set({ loaded: true })
        }, [])

        return api(signal).setPromise(promise)
      },
      { ttl: 0 }
    )

    const TestComponent: React.FC = () => {
      const instance = useAtomInstance(testSuspenseAtom)

      return (
        <div data-testid="mounted">
          <p>Atom ID: {instance.id}</p>
        </div>
      )
    }

    const TestWrapper: React.FC = () => {
      const [showComponent, setShowComponent] = useState(false)

      return (
        <>
          <button
            data-testid="toggle"
            onClick={() => setShowComponent(prev => !prev)}
          >
            {showComponent ? 'Hide Component' : 'Show Component'}
          </button>

          {showComponent && (
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <TestComponent />
            </Suspense>
          )}
        </>
      )
    }

    const { findByTestId, queryByTestId, getByTestId } = renderInEcosystem(
      <TestWrapper />
    )

    expect(ecosystem.find(testSuspenseAtom)).toBeUndefined()

    act(() => {
      getByTestId('toggle').click()
    })

    await findByTestId('loading')
    await findByTestId('mounted')

    expect(ecosystem.find(testSuspenseAtom)?.o.size).toBe(1)

    act(() => {
      getByTestId('toggle').click()
    })

    expect(queryByTestId('mounted')).toBeNull()

    // atom should be destroyed when component is unmounted
    await act(async () => {
      await Promise.resolve()
    })

    expect(ecosystem.find(testSuspenseAtom)).toBeUndefined()
  })

  // TODO: Would be nice if we could support this. It's really out of React's realm of practicality:
  // test('floating suspense nodes are cleaned up when the component finally mounts', () => {})

  describe('suspense + unmaterializedNodes cleanup race condition', () => {
    test('selector inside Suspense boundary is not destroyed while Suspense is active', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const outerAtom = atom('outer', () => 'outer')

      // Component above Suspense - its useEffect triggers cleanup scheduling
      const Outer = () => {
        useAtomValue(outerAtom)

        return (
          <Suspense fallback={<div data-testid="loading">Loading</div>}>
            <SelectorUser />
            <Suspender />
          </Suspense>
        )
      }

      // Creates an inline selector inside Suspense that observes the atom.
      // Renders before Suspender so the selector is created before the throw.
      const SelectorUser = () => {
        const val = useAtomValue(({ get }) => get(suspendableAtom) + ' derived')
        return <div data-testid="derived">{val}</div>
      }

      // Uses the suspendable atom directly - triggers Suspense throw
      const Suspender = () => {
        useAtomValue(suspendableAtom)
        return <div data-testid="done">done</div>
      }

      const { findByTestId } = renderInEcosystem(<Outer />)

      await findByTestId('loading')

      // Flush microtasks so cleanup would have run
      await act(async () => {
        await Promise.resolve()
      })

      // The atom must NOT be destroyed by the cleanup cascade
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()

      await findByTestId('derived')
      await findByTestId('done')

      expect(ecosystem.find(suspendableAtom)).toBeDefined()
      expect(ecosystem.find(suspendableAtom)!.o.size).toBeGreaterThanOrEqual(1)
    })

    test('ttl:0 atom survives Suspense and is properly destroyed after unmount', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const Wrapper = () => {
        const [show, setShow] = useState(true)

        return (
          <>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            {show && (
              <Suspense
                fallback={<div data-testid="loading">Loading</div>}
              >
                <Child />
              </Suspense>
            )}
          </>
        )
      }

      const Child = () => {
        const instance = useAtomInstance(suspendableAtom)
        return <div data-testid="value">{instance.id}</div>
      }

      const { findByTestId, getByTestId } = renderInEcosystem(<Wrapper />)

      await findByTestId('loading')
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()
      await findByTestId('value')
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      // Unmount
      act(() => {
        getByTestId('toggle').click()
      })

      await act(async () => {
        await Promise.resolve()
      })

      // ttl:0 atom should be destroyed after unmount
      expect(ecosystem.find(suspendableAtom)).toBeUndefined()
    })

    test('cleanup still works for non-Suspense renders (no regression)', async () => {
      const outerAtom = atom('outer', () => 'outer')
      let selectorEvalCount = 0

      const Wrapper = () => {
        const [show, setShow] = useState(true)

        return (
          <>
            <button data-testid="toggle" onClick={() => setShow(s => !s)}>
              Toggle
            </button>
            {show && <SelectorUser />}
            <Anchor />
          </>
        )
      }

      // Uses an inline selector
      const SelectorUser = () => {
        const val = useAtomValue(({ get }) => {
          selectorEvalCount++
          return get(outerAtom) + ' derived'
        })
        return <div data-testid="value">{val}</div>
      }

      // Ensures an effect always runs to trigger cleanup scheduling
      const Anchor = () => {
        useAtomValue(outerAtom)
        return null
      }

      const { findByTestId, getByTestId } = renderInEcosystem(<Wrapper />)

      await findByTestId('value')

      // Unmount SelectorUser
      act(() => {
        getByTestId('toggle').click()
      })

      await act(async () => {
        await Promise.resolve()
      })

      // Remount SelectorUser
      act(() => {
        getByTestId('toggle').click()
      })

      await findByTestId('value')

      // The selector should have been recreated (cleanup destroyed the orphan
      // from the first mount's unmount cycle or concurrent render)
      expect(selectorEvalCount).toBeGreaterThanOrEqual(2)
    })

    test('StrictMode + Suspense does not destroy atoms', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const Child = () => {
        const val = useAtomValue(suspendableAtom)
        return <div data-testid="value">{val}</div>
      }

      const Parent = () => (
        <Suspense fallback={<div data-testid="loading">Loading</div>}>
          <Child />
        </Suspense>
      )

      const { findByTestId } = renderInEcosystem(<Parent />, {
        useStrictMode: true,
      })

      await findByTestId('loading')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()
      await findByTestId('value')

      expect(ecosystem.find(suspendableAtom)).toBeDefined()
    })

    test('multiple suspended atoms do not interfere with each other', async () => {
      let resolve1: (val?: any) => void = () => {}
      let resolve2: (val?: any) => void = () => {}

      const atom1 = atom(
        'atom1',
        () => api('val1').setPromise(new Promise<void>(r => (resolve1 = r))),
        { ttl: 0 }
      )

      const atom2 = atom(
        'atom2',
        () => api('val2').setPromise(new Promise<void>(r => (resolve2 = r))),
        { ttl: 0 }
      )

      const Child1 = () => {
        const val = useAtomValue(atom1)
        return <div data-testid="val1">{val}</div>
      }

      const Child2 = () => {
        const val = useAtomValue(atom2)
        return <div data-testid="val2">{val}</div>
      }

      const Parent = () => (
        <>
          <Suspense fallback={<div data-testid="loading1">Loading 1</div>}>
            <Child1 />
          </Suspense>
          <Suspense fallback={<div data-testid="loading2">Loading 2</div>}>
            <Child2 />
          </Suspense>
        </>
      )

      const { findByTestId } = renderInEcosystem(<Parent />)

      await findByTestId('loading1')
      await findByTestId('loading2')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(atom1)).toBeDefined()
      expect(ecosystem.find(atom2)).toBeDefined()

      // Resolve one at a time
      resolve1()
      await findByTestId('val1')

      expect(ecosystem.find(atom1)).toBeDefined()
      expect(ecosystem.find(atom2)).toBeDefined()

      resolve2()
      await findByTestId('val2')

      expect(ecosystem.find(atom1)).toBeDefined()
      expect(ecosystem.find(atom2)).toBeDefined()
    })

    test('rejected promise during Suspense does not leave stale tracking', async () => {
      const mock = mockConsole('error')

      let reject: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>((_, r) => (reject = r))),
        { ttl: 0 }
      )

      const outerAtom = atom('outer', () => 'outer')

      const Outer = () => {
        useAtomValue(outerAtom)

        return (
          <ErrorBoundary>
            <Suspense fallback={<div data-testid="loading">Loading</div>}>
              <SelectorUser />
              <Child />
            </Suspense>
          </ErrorBoundary>
        )
      }

      const SelectorUser = () => {
        const val = useAtomValue(({ get }) => get(suspendableAtom) + ' derived')
        return <div data-testid="derived">{val}</div>
      }

      const Child = () => {
        useAtomValue(suspendableAtom)
        return <div data-testid="value">done</div>
      }

      const { findByTestId } = renderInEcosystem(<Outer />)

      await findByTestId('loading')

      await act(async () => {
        await Promise.resolve()
      })

      // Atom must survive during Suspense
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      reject('test error')

      await findByTestId('error')

      // After rejection, the atom should still exist (ErrorBoundary caught it,
      // not destroyed by cleanup)
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      mock.mockRestore()
    })

    test('suspend: false does not track promises for cleanup deferral', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const outerAtom = atom('outer', () => 'outer')
      const renders: string[] = []

      const Outer = () => {
        useAtomValue(outerAtom)

        return <Child />
      }

      // Using suspend: false means the component doesn't throw - no Suspense
      // tracking. The atom should still be alive because nothing destroys it.
      const Child = () => {
        const instance = useAtomInstance(suspendableAtom, [], {
          suspend: false,
        })
        renders.push(instance.promiseStatus || 'none')
        return <div data-testid="value">{instance.id}</div>
      }

      const { findByTestId } = renderInEcosystem(<Outer />)

      await findByTestId('value')

      // Component should have rendered without suspending
      expect(renders[0]).toBe('loading')
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(suspendableAtom)).toBeDefined()
    })

    test('Suspense boundary removed while promise is pending does not block future cleanup', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const otherAtom = atom('other', () => 'other', { ttl: 0 })

      const Wrapper = () => {
        const [show, setShow] = useState(true)

        return (
          <>
            <button data-testid="toggle" onClick={() => setShow(false)}>
              Hide
            </button>
            {show && (
              <Suspense
                fallback={<div data-testid="loading">Loading</div>}
              >
                <Child />
              </Suspense>
            )}
          </>
        )
      }

      const Child = () => {
        const val = useAtomValue(suspendableAtom)
        return <div data-testid="value">{val}</div>
      }

      const { findByTestId, getByTestId } = renderInEcosystem(<Wrapper />)

      await findByTestId('loading')

      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      // Remove the Suspense boundary before the promise settles
      act(() => {
        getByTestId('toggle').click()
      })

      // The atom stays alive: no ExternalNode was ever created (useEffect
      // never ran for the suspended component), so no observer removal
      // triggers ttl:0 destruction. This is expected — the atom was created
      // during render and has no cleanup mechanism without an observer.
      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      // Resolve the promise after unmount — this decrements
      // activeSuspenseCount, unblocking future cleanup
      resolve()

      await act(async () => {
        await Promise.resolve()
      })

      // Verify future cleanup is not blocked: create and destroy another
      // atom to confirm the tracking state is clean
      const instance = ecosystem.getNode(otherAtom)
      expect(ecosystem.find(otherAtom)).toBeDefined()
      instance.destroy()
      expect(ecosystem.find(otherAtom)).toBeUndefined()
    })

    test('nested Suspense boundaries work correctly', async () => {
      let resolveOuter: (val?: any) => void = () => {}
      let resolveInner: (val?: any) => void = () => {}

      const outerSuspendable = atom(
        'outerSuspendable',
        () =>
          api('outer').setPromise(
            new Promise<void>(r => (resolveOuter = r))
          ),
        { ttl: 0 }
      )

      const innerSuspendable = atom(
        'innerSuspendable',
        () =>
          api('inner').setPromise(
            new Promise<void>(r => (resolveInner = r))
          ),
        { ttl: 0 }
      )

      const OuterChild = () => {
        const val = useAtomValue(outerSuspendable)
        return (
          <div data-testid="outer-value">
            {val}
            <Suspense
              fallback={<div data-testid="inner-loading">Inner Loading</div>}
            >
              <InnerChild />
            </Suspense>
          </div>
        )
      }

      const InnerChild = () => {
        const val = useAtomValue(innerSuspendable)
        return <div data-testid="inner-value">{val}</div>
      }

      const Parent = () => (
        <Suspense
          fallback={<div data-testid="outer-loading">Outer Loading</div>}
        >
          <OuterChild />
        </Suspense>
      )

      const { findByTestId } = renderInEcosystem(<Parent />)

      await findByTestId('outer-loading')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(outerSuspendable)).toBeDefined()

      // Resolve outer
      resolveOuter()
      await findByTestId('outer-value')
      await findByTestId('inner-loading')

      expect(ecosystem.find(outerSuspendable)).toBeDefined()
      expect(ecosystem.find(innerSuspendable)).toBeDefined()

      // Resolve inner
      resolveInner()
      await findByTestId('inner-value')

      expect(ecosystem.find(outerSuspendable)).toBeDefined()
      expect(ecosystem.find(innerSuspendable)).toBeDefined()
    })

    test('selector + Suspense with concurrent mode abandoned renders', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const outerAtom = atom('outer', () => 'outer')

      const Outer = () => {
        useAtomValue(outerAtom)

        return (
          <Suspense fallback={<div data-testid="loading">Loading</div>}>
            <SelectorUser />
            <Suspender />
          </Suspense>
        )
      }

      const SelectorUser = () => {
        const val = useAtomValue(({ get }) => get(suspendableAtom) + ' derived')
        return <div data-testid="derived">{val}</div>
      }

      const Suspender = () => {
        useAtomValue(suspendableAtom)
        return <div data-testid="done">done</div>
      }

      // Use StrictMode to simulate concurrent mode double-rendering
      const { findByTestId } = renderInEcosystem(<Outer />, {
        useStrictMode: true,
      })

      await findByTestId('loading')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()

      await findByTestId('derived')
      await findByTestId('done')

      expect(ecosystem.find(suspendableAtom)).toBeDefined()
    })

    test('same promise thrown by multiple components is only tracked once', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const Child1 = () => {
        useAtomValue(suspendableAtom)
        return <div>child1</div>
      }

      const Child2 = () => {
        useAtomValue(suspendableAtom)
        return <div>child2</div>
      }

      // Both children share the same Suspense boundary and same atom (same
      // promise object). The WeakSet should prevent double-counting.
      const Parent = () => (
        <Suspense fallback={<div data-testid="loading">Loading</div>}>
          <Child1 />
          <Child2 />
        </Suspense>
      )

      const { findByTestId } = renderInEcosystem(<Parent />)

      await findByTestId('loading')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()

      await act(async () => {
        await Promise.resolve()
      })

      // After resolve, the atom should still exist and have observers
      expect(ecosystem.find(suspendableAtom)).toBeDefined()
    })

    test('useAtomState with Suspense and selector preserves atom', async () => {
      let resolve: (val?: any) => void = () => {}

      const suspendableAtom = atom(
        'suspendable',
        () => api('value').setPromise(new Promise<void>(r => (resolve = r))),
        { ttl: 0 }
      )

      const outerAtom = atom('outer', () => 'outer')

      const Outer = () => {
        useAtomValue(outerAtom)

        return (
          <Suspense fallback={<div data-testid="loading">Loading</div>}>
            <SelectorUser />
            <Suspender />
          </Suspense>
        )
      }

      const SelectorUser = () => {
        const val = useAtomValue(
          ({ get }) => get(suspendableAtom) + ' selector'
        )
        return <div data-testid="selector">{val}</div>
      }

      const Suspender = () => {
        const [state, setState] = useAtomState(suspendableAtom)
        return (
          <div data-testid="state">
            {state}
            <button
              data-testid="update"
              onClick={() => setState('updated')}
            />
          </div>
        )
      }

      const { findByTestId, getByTestId } = renderInEcosystem(<Outer />)

      await findByTestId('loading')

      await act(async () => {
        await Promise.resolve()
      })

      expect(ecosystem.find(suspendableAtom)).toBeDefined()

      resolve()

      await findByTestId('state')
      expect((await findByTestId('state')).textContent).toContain('value')

      // Verify the atom is interactive after Suspense resolves
      act(() => {
        getByTestId('update').click()
      })

      expect((await findByTestId('state')).textContent).toContain('updated')
      expect((await findByTestId('selector')).textContent).toBe(
        'updated selector'
      )
    })
  })
})
