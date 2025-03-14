import { act, fireEvent } from '@testing-library/react'
import {
  api,
  atom,
  injectAtomValue,
  injectEffect,
  injectSignal,
  useAtomValue,
} from '@zedux/react'
import React, { useState } from 'react'
import { timer } from 'rxjs'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('ttl', () => {
  test('component unmount destroys an instance', async () => {
    jest.useFakeTimers()
    const evaluations: number[] = []
    const effects: number[] = []

    const atom1 = atom('atom1', () => {
      evaluations.push(1)
      const store = injectSignal('1')

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

    const { findByText } = renderInEcosystem(<Child />)

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

  test('a promise ttl waits until the promise resolves to destroy the instance', async () => {
    jest.useFakeTimers()
    const promise = new Promise(resolve =>
      setTimeout(() => {
        resolve(1)
      }, 1)
    )

    const atom1 = atom('1', () => api().setTtl(promise))
    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.status).toBe('Active')

    instance1.on(() => {}, { active: true })() // add dependent and immediately clean it up

    expect(instance1.status).toBe('Stale')

    jest.runAllTimers()

    // this `.then()` creates a new promise that's guaranteed to run after the
    // chained `.then` inside `AtomInstance.ts`
    await promise.then(() => {})

    expect(instance1.status).toBe('Destroyed')
  })

  test('a promise ttl cancels destruction if the instance is revived', async () => {
    jest.useFakeTimers()
    const promise = new Promise(resolve =>
      setTimeout(() => {
        resolve(1)
      }, 1)
    )

    const atom1 = atom('1', () => api().setTtl(promise))
    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.status).toBe('Active')

    instance1.on(() => {}, { active: true })() // add dependent and immediately clean it up

    expect(instance1.status).toBe('Stale')

    jest.runAllTimers()
    const cleanup = instance1.on(() => {}, { active: true })

    expect(instance1.status).toBe('Active')

    // this `.then()` creates a new promise that's guaranteed to run after the
    // chained `.then` inside `AtomInstance.ts`
    await promise.then(() => {})

    expect(instance1.status).toBe('Active')

    cleanup()

    expect(instance1.status).toBe('Stale')

    jest.runAllTimers()
    await promise.then(() => {})

    expect(instance1.status).toBe('Destroyed')
  })

  test('an observable ttl waits until the observable emits to destroy the instance', async () => {
    jest.useFakeTimers()
    const observable = timer(1)

    const atom1 = atom('1', () => api().setTtl(observable))
    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.status).toBe('Active')

    instance1.on(() => {}, { active: true })() // add dependent and immediately clean it up

    expect(instance1.status).toBe('Stale')

    jest.runAllTimers()

    expect(instance1.status).toBe('Destroyed')
  })

  test('an observable ttl cancels destruction if the instance is revived', async () => {
    jest.useFakeTimers()
    const observable = timer(2)

    const atom1 = atom('1', () => api().setTtl(observable))
    const instance1 = ecosystem.getInstance(atom1)

    expect(instance1.status).toBe('Active')

    instance1.on(() => {}, { active: true })() // add dependent and immediately clean it up

    expect(instance1.status).toBe('Stale')

    jest.advanceTimersByTime(1)
    const cleanup = instance1.on(() => {}, { active: true })

    expect(instance1.status).toBe('Active')

    cleanup()

    expect(instance1.status).toBe('Stale')

    jest.runAllTimers()

    expect(instance1.status).toBe('Destroyed')
  })
})
