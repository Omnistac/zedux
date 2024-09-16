import { api, atom, useAtomValue } from '@zedux/react'
import React, { Suspense } from 'react'
import { ErrorBoundary } from '../utils/ErrorBoundary'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { mockConsole } from '../utils/console'
import { ecosystem } from '../utils/ecosystem'
import { act } from '@testing-library/react'

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
      expect.any(String),
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
      expect.any(String),
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
      ecosystem.getInstance(atom1).setStateDeep({ data: 'c' })
    })

    await Promise.resolve()

    expect(div2.innerHTML).toBe('c')
  })
})
