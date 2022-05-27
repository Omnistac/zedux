import { act, fireEvent, render } from '@testing-library/react'
import {
  atom,
  createEcosystem,
  EcosystemProvider,
  injectAtomValue,
  injectEffect,
  injectStore,
  useAtomValue,
} from '@zedux/react'
import React, { useState } from 'react'

const testEcosystem = createEcosystem({ id: 'test' })

afterEach(() => {
  testEcosystem.wipe()
})

describe('maxInstances', () => {
  test('maxInstances 0 always destroys everything', () => {
    const atomA = atom('a', 'a', { maxInstances: 0 })
    const atomB = atom('b', () => {
      const a = injectAtomValue(atomA)

      return a + 'b'
    })
    const es = createEcosystem({ id: 'maxInstances' })

    const instanceB = es.getInstance(atomB)

    expect(es._instances).toEqual({
      a: expect.any(Object),
      b: expect.any(Object),
    })

    expect(es.get(atomA)).toBe('a')
    expect(es.get(atomB)).toBe('ab')

    instanceB.destroy()

    expect(es._instances).toEqual({})

    es.destroy()
  })

  test('maxInstances takes precedence over ttl', () => {
    jest.useFakeTimers()
    const atomA = atom('a', (param: string) => param, {
      maxInstances: 1,
      ttl: 10,
    })
    const atomB = atom('b', (param: string) => {
      const a = injectAtomValue(atomA, [param])

      return a + 'b'
    })
    const es = createEcosystem({ id: 'maxInstances' })

    const instance1 = es.getInstance(atomB, ['a'])
    const instance2 = es.getInstance(atomB, ['aa'])

    expect(es._instances).toEqual({
      'a-["a"]': expect.any(Object),
      'a-["aa"]': expect.any(Object),
      'b-["a"]': expect.any(Object),
      'b-["aa"]': expect.any(Object),
    })

    expect(es.get(atomA, ['a'])).toBe('a')
    expect(es.get(atomA, ['aa'])).toBe('aa')
    expect(es.get(atomB, ['a'])).toBe('ab')
    expect(es.get(atomB, ['aa'])).toBe('aab')

    // The first destruction should destroy the first atomA instance immediately
    instance1.destroy()

    expect(es._instances).toEqual({
      'a-["aa"]': expect.any(Object),
      'b-["aa"]': expect.any(Object),
    })

    instance2.destroy()

    expect(es._instances).toEqual({
      'a-["aa"]': expect.any(Object),
    })

    jest.runAllTimers()

    expect(es._instances).toEqual({})

    es.destroy()
  })
})

describe('ttl', () => {
  test('component unmount destroys an instance', async () => {
    jest.useFakeTimers()
    const evaluations: number[] = []
    const effects: number[] = []

    const atom1 = atom('atom1', () => {
      evaluations.push(1)
      const store = injectStore('1')

      return store
    })

    const atom2 = atom('atom2', () => {
      evaluations.push(2)
      const atom1val = injectAtomValue(atom1)

      return atom1val + '2'
    })

    const atom3 = atom(
      'atom3',
      (id: string) => {
        evaluations.push(3)
        const atom1val = injectAtomValue(atom1)
        const atom2val = injectAtomValue(atom2)

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
        const atom3val = injectAtomValue(atom3, ['1'])
        const atom1val = injectAtomValue(atom1)

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
      const atom3val = useAtomValue(atom3, ['2'])
      const atom2val = useAtomValue(atom2)
      const atom1val = useAtomValue(atom1)

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
      const atom4val = useAtomValue(atom4)
      const atom3val = useAtomValue(atom3, ['1'])

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

    act(() => {
      fireEvent.click(button)
    })

    await findByText('One')
    expect(effects).toEqual([])

    jest.runAllTimers()
    expect(effects).toEqual([4, 3])

    act(() => {
      fireEvent.click(button)
    })

    await findByText('Two')
    expect(effects).toEqual([4, 3, 3])
    expect(evaluations).toEqual([4, 3, 1, 2, 3, 4, 3])

    jest.runAllTimers() // no ttl timeouts should run
    expect(effects).toEqual([4, 3, 3])

    act(() => {
      fireEvent.click(button)
    })
    await findByText('One')
    jest.advanceTimersByTime(2) // allow 3-["2"] effect to run, but not 4 ttl

    act(() => {
      fireEvent.click(button)
    })

    await findByText('Two')
    jest.runAllTimers() // again, no ttl timeouts should run

    expect(effects).toEqual([4, 3, 3, 3])
    expect(evaluations).toEqual([4, 3, 1, 2, 3, 4, 3, 3])
  })
})
