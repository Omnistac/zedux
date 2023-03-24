import { api, atom, createEcosystem, useAtomValue } from '@zedux/react'
import React, { Suspense } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

const ecosystem = createEcosystem({ id: 'test' })

afterAll(() => {
  ecosystem.destroy()
})

afterEach(() => {
  ecosystem.reset()
})

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
})
