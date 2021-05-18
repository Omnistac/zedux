import { fireEvent } from '@testing-library/dom'
import { act, render } from '@testing-library/react'
import {
  api,
  atom,
  createStore,
  ecosystem,
  injectGet,
  injectStore,
} from '@zedux/react'
import React from 'react'

const atom1 = atom('atom1', () => 1)
const atom2 = atom('atom2', () => 2)
const atom3 = atom('atom3', () => 3)

const atom4 = atom('atom4', () => {
  const switchStore = injectStore(true, true)
  const sumStore = injectStore(0)
  const store = injectStore(() =>
    createStore({ switch: switchStore, sum: sumStore })
  )
  const get = injectGet()

  const one = get(atom1)
  const two = switchStore.getState() ? get(atom2) : get(atom3)

  // won't cause a reevaluation loop 'cause we don't subscribe to the store
  sumStore.setState(one + two)

  return api(store).setExports({
    toggle: () => switchStore.setState(val => !val),
  })
})

describe('graph', () => {
  test('injectGet', async () => {
    jest.useFakeTimers()

    const testEcosystem = ecosystem({ id: 'test' })

    function Test() {
      const { sum } = atom4.useValue()
      const { toggle } = atom4.useExports()

      return (
        <>
          <div data-testid="sum">{sum}</div>
          <button onClick={toggle}>toggle</button>
        </>
      )
    }

    const { findByTestId, findByText } = render(
      <testEcosystem.Provider>
        <Test />
      </testEcosystem.Provider>
    )

    const div = await findByTestId('sum')
    expect(div).toHaveTextContent('3')

    const expectedEdges = [
      {
        isAsync: false,
        isStatic: false,
        operation: 'get',
        shouldUpdate: undefined,
      },
    ]

    expect(testEcosystem.graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem.graph.nodes.atom2.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem.graph.nodes.atom3).toBeUndefined()

    expect(testEcosystem.graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom2: true,
    })

    const button = await findByText('toggle')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    expect(div).toHaveTextContent('4')

    expect(testEcosystem.graph.nodes.atom1.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem.graph.nodes.atom2.dependents).toEqual({})

    expect(testEcosystem.graph.nodes.atom3.dependents).toEqual({
      atom4: expectedEdges,
    })

    expect(testEcosystem.graph.nodes.atom4.dependencies).toEqual({
      atom1: true,
      atom3: true,
    })
  })
})
