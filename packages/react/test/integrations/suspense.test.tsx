import {
  api,
  atom,
  injectAtomValue,
  injectPromise,
  StateOf,
  useAtomInstance,
  useAtomState,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'
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
})
