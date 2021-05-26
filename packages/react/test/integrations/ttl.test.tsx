import { fireEvent, render } from '@testing-library/react'
import {
  atom,
  ecosystem,
  EcosystemProvider,
  injectEffect,
  injectStore,
} from '@zedux/react'
import React, { useState } from 'react'

const testEcosystem = ecosystem({ id: 'test' })

afterEach(() => {
  testEcosystem.wipe()
})

describe('ttl', () => {
  test('component unmount destroys an instance', async () => {
    jest.useFakeTimers()
    const evaluations: number[] = []
    const effects: number[] = []

    const atom1 = atom('atom1', () => {
      evaluations.push(1)
      const store = injectStore('1', true)

      return store
    })

    const atom2 = atom('atom2', () => {
      evaluations.push(2)
      const atom1val = atom1.injectValue()

      return atom1val + '2'
    })

    const atom3 = atom(
      'atom3',
      (id: string) => {
        evaluations.push(3)
        const atom1val = atom1.injectValue()
        const atom2val = atom2.injectValue()

        injectEffect(
          () => () => {
            effects.push(3)
          },
          []
        )

        return `${id} ${atom1val} ${atom2val}`
      },
      { ttl: 0 }
    )

    const atom4 = atom(
      'atom4',
      () => {
        evaluations.push(4)
        const atom3val = atom3.injectValue('1')
        const atom1val = atom1.injectValue()

        injectEffect(
          () => () => {
            effects.push(4)
          },
          []
        )

        return `${atom3val} ${atom1val}`
      },
      { ttl: 5 }
    )

    function One() {
      const atom3val = atom3.useValue('2')
      const atom2val = atom2.useValue()
      const atom1val = atom1.useValue()

      return (
        <>
          <div>One</div>
          <div>{atom1val}</div>
          <div>{atom2val}</div>
          <div>{atom3val}</div>
        </>
      )
    }

    function Two() {
      const atom4val = atom4.useValue()
      const atom3val = atom3.useValue('1')

      return (
        <>
          <div>Two</div>
          <div>{atom3val}</div>
          <div>{atom4val}</div>
        </>
      )
    }

    function Child() {
      const [view, setView] = useState(false)

      return (
        <>
          {view ? <One /> : <Two />}
          <button onClick={() => setView(curr => !curr)}>
            Change Children
          </button>
        </>
      )
    }

    function Test() {
      return (
        <EcosystemProvider ecosystem={testEcosystem}>
          <Child />
        </EcosystemProvider>
      )
    }

    const { findByText } = render(<Test />)

    expect(evaluations).toEqual([4, 3, 1, 2])

    jest.runAllTimers() // make 4 and 3-["1"] effects run

    const button = await findByText('Change Children')
    fireEvent.click(button)

    await findByText('One')
    expect(effects).toEqual([])

    jest.runAllTimers()
    expect(effects).toEqual([4, 3])

    fireEvent.click(button)
    await findByText('Two')
    expect(effects).toEqual([4, 3, 3])
    expect(evaluations).toEqual([4, 3, 1, 2, 3, 4, 3])

    jest.runAllTimers() // no ttl timeouts should run
    expect(effects).toEqual([4, 3, 3])

    fireEvent.click(button)
    await findByText('One')
    jest.advanceTimersByTime(2) // allow 3-["2"] effect to run, but not 4 ttl
    fireEvent.click(button)
    await findByText('Two')
    jest.runAllTimers() // again, no ttl timeouts should run

    expect(effects).toEqual([4, 3, 3, 3])
    expect(evaluations).toEqual([4, 3, 1, 2, 3, 4, 3, 3])
  })
})
