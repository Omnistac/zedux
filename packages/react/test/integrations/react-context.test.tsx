import {
  atom,
  AtomInstanceProvider,
  useAtomConsumer,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Component } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('React context', () => {
  test('a provided atom instance can be consumed dynamically anywhere', async () => {
    const atom1 = atom('1', (param: string) => param)
    let counter = 0

    function Grandchild() {
      const val = useAtomValue(useAtomConsumer(atom1, true))

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
          <AtomInstanceProvider instance={instance1}>
            <Child />
          </AtomInstanceProvider>
          <AtomInstanceProvider instance={instance2}>
            <Child />
          </AtomInstanceProvider>
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
      const val1 = useAtomValue(useAtomConsumer(atom1, true))
      const val2 = useAtomValue(useAtomConsumer(atom2, ['c']))

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
        <>
          <AtomInstanceProvider instances={[instance1, instance2]}>
            <Child />
          </AtomInstanceProvider>
        </>
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
      const val = useAtomValue(useAtomConsumer(atom1, true))

      return <div data-testid="0">{val}</div>
    }

    function Test() {
      return (
        <>
          {/** @ts-expect-error missing prop */}
          <AtomInstanceProvider>
            <Child />
          </AtomInstanceProvider>
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
          // You can render any custom fallback UI
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

    expect(div.innerHTML).toMatch(/AtomInstanceProvider.*requires.*prop/i)
    expect(spy).toHaveBeenCalledTimes(3)

    spy.mockReset()
  })
})
