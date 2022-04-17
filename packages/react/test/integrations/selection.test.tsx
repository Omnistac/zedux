import { act, fireEvent, render } from '@testing-library/react'
import {
  atom,
  AtomGetters,
  createEcosystem,
  EcosystemProvider,
  useAtomSelector,
} from '@zedux/react'
import React, { useState } from 'react'

const testEcosystem = createEcosystem({ id: 'test' })
const atom1 = atom('atom1', (key: string) => key)

afterEach(() => {
  testEcosystem.wipe()
})

describe('selection', () => {
  test('default argsComparator prevents selector from running if selector reference and all args are the same', async () => {
    jest.useFakeTimers()

    const selector1 = jest.fn(({ get }: AtomGetters, key: string) => {
      console.log('here in selector1!!!!!', get(atom1, [key]))
      return get(atom1, [key])
    })

    const selector2 = jest.fn(({ select }: AtomGetters) =>
      select(
        {
          selector: selector1,
        },
        'a'
      )
    )

    function Test() {
      const [, setState] = useState(1)
      const val = useAtomSelector(selector2)

      return (
        <>
          <button onClick={() => setState(2)} data-testid="button"></button>
          <div data-testid="text">{val}</div>
        </>
      )
    }

    const { findByTestId } = render(
      <EcosystemProvider ecosystem={testEcosystem}>
        <Test />
      </EcosystemProvider>
    )

    const button = await findByTestId('button')
    const text = await findByTestId('text')

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)
    expect(text.innerHTML).toBe('a')

    act(() => {
      fireEvent.click(button)
    })

    jest.runAllTimers()

    expect(selector1).toHaveBeenCalledTimes(1)
    expect(selector2).toHaveBeenCalledTimes(1)

    console.log('weak instance:', testEcosystem._instances)
    testEcosystem.weakGetInstance(atom1, ['a'])?.setState('b')

    jest.runAllTimers()

    expect(selector1).toHaveBeenCalledTimes(2)
    expect(selector2).toHaveBeenCalledTimes(2)
    expect(text.innerHTML).toBe('b')
  })
})
