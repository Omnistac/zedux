import { api, atom } from '@zedux/atoms'
import { useAtomState } from '@zedux/react'
import React, { act } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('useAtomState', () => {
  test('returns an exports-infused setter', () => {
    const atom1 = atom('1', () => {
      return api(1).setExports({
        test: 2,
      })
    })

    let state: any
    let setState: any

    function Test() {
      ;[state, setState] = useAtomState(atom1)

      return null
    }

    renderInEcosystem(<Test />)

    expect(state).toBe(1)
    expect(setState.test).toBe(2)

    act(() => {
      setState(3)
    })

    expect(state).toBe(3)
  })
})
