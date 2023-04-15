import { api, atom, useAtomValue } from '@zedux/react'
import React, { Suspense } from 'react'
import { ErrorBoundary } from '../utils/ErrorBoundary'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { ecosystem } from '../utils/ecosystem'

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

    const { findByTestId } = renderInEcosystem(<Parent />, ecosystem)

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

    const { findByTestId } = renderInEcosystem(<Parent />, ecosystem)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    resolve('b')

    const div2 = await findByTestId('b')

    expect(div2.innerHTML).toBe('b')
  })

  test('api().setPromise() rejected error hits ErrorBoundary', async () => {
    const originalConsoleError = console.error
    const mock = (console.error = jest.fn())

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

    const { findByTestId } = renderInEcosystem(<Parent />, ecosystem)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    reject('b')

    const div2 = await findByTestId('error')

    expect(div2.innerHTML).toBe('b')
    expect(mock).toHaveBeenCalledTimes(3)
    expect(mock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: expect.stringMatching(/uncaught 'b'/i),
      })
    )

    console.error = originalConsoleError
  })

  test('api(promise) rejected error hits ErrorBoundary', async () => {
    const originalConsoleError = console.error
    const mock = (console.error = jest.fn())

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

    const { findByTestId } = renderInEcosystem(<Parent />, ecosystem)

    const div1 = await findByTestId('a')

    expect(div1.innerHTML).toBe('a')

    reject('b')

    const div2 = await findByTestId('error')

    expect(div2.innerHTML).toBe('b')
    expect(mock).toHaveBeenCalledTimes(3)
    expect(mock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: expect.stringMatching(/uncaught 'b'/i),
      })
    )

    console.error = originalConsoleError
  })
})
