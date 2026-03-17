import {
  api,
  atom,
  injectAtomValue,
  injectEcosystem,
  injectEffect,
  injectSignal,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import React, { act, useEffect } from 'react'
import { useAtomValue } from '@zedux/react'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('timing', () => {
  test('effect ordering outside React', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      calls.push('atom 1 a')

      injectEffect(() => {
        calls.push('atom 1 effect 1')
      }, [])

      calls.push('atom 1 b')

      injectEffect(() => {
        calls.push('atom 1 effect 2')
      }, [])

      calls.push('atom 1 c')
    })

    const atom2 = atom('2', () => {
      injectEcosystem().get(atom1)
      calls.push('atom 2 a')

      injectEffect(() => {
        calls.push('atom 2 effect')
      }, [])

      calls.push('atom 2 b')
    })

    ecosystem.getNode(atom2)

    expect(calls).toEqual([
      'atom 1 a',
      'atom 1 b',
      'atom 1 c',
      'atom 2 a',
      'atom 2 b',
      'atom 1 effect 1',
      'atom 1 effect 2',
      'atom 2 effect',
    ])
  })

  test('effect ordering in React', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      calls.push('atom 1 a')

      injectEffect(() => {
        calls.push('atom 1 effect 1')
      }, [])

      calls.push('atom 1 b')

      injectEffect(() => {
        calls.push('atom 1 effect 2')
      }, [])

      calls.push('atom 1 c')

      return 'a'
    })

    const atom2 = atom('2', () => {
      const val1 = injectEcosystem().get(atom1)
      calls.push('atom 2 a')

      injectEffect(() => {
        calls.push('atom 2 effect')
      }, [])

      calls.push('atom 2 b')

      return val1 + 'b'
    })

    function Child() {
      const val = useAtomValue(atom2)
      calls.push('Child')

      useEffect(() => {
        calls.push('Child effect')
      }, [])

      return <div>{val}</div>
    }

    function Parent() {
      useAtomValue(atom2)
      calls.push('Parent')

      useEffect(() => {
        calls.push('Parent effect')
      }, [])

      return <Child />
    }

    renderInEcosystem(<Parent />)

    ecosystem.asyncScheduler.flush()

    expect(calls).toEqual([
      'atom 1 a',
      'atom 1 b',
      'atom 1 c',
      'atom 2 a',
      'atom 2 b',
      'Parent',
      'Child',
      'Child effect',
      'Parent effect',
      'atom 1 effect 1',
      'atom 1 effect 2',
      'atom 2 effect',
    ])
  })

  test('effect callbacks are not batched when run outside React', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const signal = injectSignal(0)

      calls.push(signal.get())

      injectEffect(() => {
        signal.set(state => state + 1)
        signal.set(state => state + 1)
      }, [])

      return api(signal).setExports({
        update: () => signal.set(state => state + 1),
      })
    })

    const node1 = ecosystem.getNode(atom1)

    expect(node1.get()).toBe(2)
    expect(calls).toEqual([0, 1, 2])
  })

  test('effect callbacks are not batched when run in React', () => {
    const calls: any[] = []

    const atom1 = atom('1', () => {
      const signal = injectSignal(0)

      calls.push(signal.get())

      injectEffect(() => {
        signal.set(state => state + 1)
        signal.set(state => state + 1)
      }, [])

      return api(signal).setExports({
        update: () => signal.set(state => state + 1),
      })
    })

    function Test() {
      const val = useAtomValue(atom1)

      return <div>{val}</div>
    }

    renderInEcosystem(<Test />, { useStrictMode: true })

    act(() => {
      ecosystem.asyncScheduler.flush()
    })

    expect(calls).toEqual([0, 1, 2])
  })

  test('effect state updates are immediately visible to downstream atoms in React', () => {
    const evaluations: any[] = []

    const sourceAtom = atom('source', () => {
      const signal = injectSignal('initial')

      injectEffect(() => {
        signal.set('updated')
      }, [])

      return signal
    })

    const downstreamAtom = atom('downstream', () => {
      const val = injectAtomValue(sourceAtom)
      evaluations.push(val)

      return val
    })

    function Test() {
      const val = useAtomValue(downstreamAtom)

      return <div>{val}</div>
    }

    renderInEcosystem(<Test />, { useStrictMode: true })

    act(() => {
      ecosystem.asyncScheduler.flush()
    })

    expect(evaluations).toEqual(['initial', 'updated'])
    expect(ecosystem.get(downstreamAtom)).toBe('updated')
  })
})
