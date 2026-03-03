import {
  api,
  atom,
  ChangeEvent,
  CycleEvent,
  EvaluationReason,
  GenericsOf,
  InvalidateEvent,
  ion,
  PromiseChangeEvent,
} from '@zedux/atoms'
import { useAtomValue } from '@zedux/react'
import { expectTypeOf } from 'expect-type'
import React from 'react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

describe('events', () => {
  test("event observers don't prevent node destruction", async () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a', { ttl: 2 })
    const node1 = ecosystem.getNode(atom1)

    function Test() {
      const state = useAtomValue(atom1)

      return <div data-testid="test">{state}</div>
    }

    const { findByTestId, unmount } = renderInEcosystem(<Test />)

    const div = await findByTestId('test')
    const calls: EvaluationReason[] = []

    expect(div.innerHTML).toBe('a')

    const cleanup = node1.on('cycle', event => {
      calls.push(event)
    })

    unmount()

    jest.advanceTimersByTime(1)
    ecosystem.asyncScheduler.flush()

    const expectedStaleEvent: CycleEvent = {
      oldStatus: 'Active',
      newStatus: 'Stale',
      operation: undefined,
      reasons: undefined,
      source: node1,
      type: 'cycle',
    }

    expect(calls).toEqual([expectedStaleEvent])
    expect(node1.L).toBeDefined()

    jest.advanceTimersByTime(2)

    const expectedDestroyedEvent: CycleEvent = {
      oldStatus: 'Stale',
      newStatus: 'Destroyed',
      // the edge is destroyed before the event is created. TODO: maybe fix
      operation: undefined,
      reasons: undefined,
      source: node1,
      type: 'cycle',
    }

    expect(calls).toEqual([expectedStaleEvent, expectedDestroyedEvent])
    expect(node1.L).toBe(undefined)
    expect(node1.o.size).toBe(0)

    cleanup() // noop

    expect(node1.L).toBe(undefined)
    expect(node1.o.size).toBe(0)
  })

  test("event observers don't cause node destruction by default", () => {
    const atom1 = atom('1', 'a', { ttl: 0 })
    const node1 = ecosystem.getNode(atom1)

    const cleanup = node1.on('cycle', () => {})

    cleanup()

    expect(node1.status).toBe('Active')

    const cleanup2 = node1.on('cycle', () => {}, { active: true })

    cleanup2()

    expect(node1.status).toBe('Destroyed')
  })

  test('cycle event', () => {
    const atom1 = atom('1', 'a')
    const atom2 = atom('2', 'b')
    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)
    const calls: any[] = []

    node1.on('cycle', event => {
      expectTypeOf(event).toEqualTypeOf<CycleEvent<GenericsOf<typeof node1>>>()

      calls.push([event.source?.id, event.oldStatus, event.newStatus])
    })

    node2.on('cycle', event => {
      calls.push([event.source?.id, event.oldStatus, event.newStatus])
    })

    node1.on(() => {}, { active: true })() // add and remove observer

    expect(calls).toEqual([['1', 'Active', 'Stale']])

    node2.destroy()

    expect(calls).toEqual([
      ['1', 'Active', 'Stale'],
      ['2', 'Active', 'Destroyed'],
    ])

    expect(node1.o.size).toBe(1)
    expect(node2.o.size).toBe(0) // listener was auto-cleaned up
  })

  test('invalidate event', () => {
    let counter = 0
    const atom1 = atom('1', () => counter++)
    const node1 = ecosystem.getNode(atom1)

    const calls: any[] = []

    node1.on('invalidate', (event, eventMap) => {
      expectTypeOf(event).toEqualTypeOf<
        InvalidateEvent<GenericsOf<typeof node1>>
      >()
      calls.push([event, eventMap])
    })

    node1.on(event => {
      expectTypeOf(event.invalidate).toEqualTypeOf<
        InvalidateEvent<GenericsOf<typeof node1>> | undefined
      >()
      calls.push([event])
    })

    expect(node1.get()).toBe(0)
    node1.invalidate()
    expect(node1.get()).toBe(1)

    const expectedInvalidateEvent: InvalidateEvent = {
      operation: undefined,
      reasons: undefined,
      source: node1,
      type: 'invalidate',
    }

    const expectedChangeEvent: ChangeEvent = {
      newState: 1,
      oldState: 0,
      operation: undefined,
      reasons: [
        {
          ...expectedInvalidateEvent,
          operation: undefined,
        },
      ],
      source: node1,
      type: 'change',
    }

    expect(calls).toEqual([
      [expectedInvalidateEvent, { invalidate: expectedInvalidateEvent }],
      [{ invalidate: expectedInvalidateEvent }],
      [{ change: expectedChangeEvent }],
    ])
  })

  test('promiseChange event', () => {
    let counter = 0
    const atom1 = atom('1', () => api(Promise.resolve(counter++)))
    const node1 = ecosystem.getNode(atom1)

    const calls: any[] = []

    node1.on('promiseChange', (event, eventMap) => {
      expectTypeOf(event).toEqualTypeOf<
        PromiseChangeEvent<GenericsOf<typeof node1>>
      >()
      calls.push([event, eventMap])
    })

    node1.on(event => {
      expectTypeOf(event.promiseChange).toEqualTypeOf<
        PromiseChangeEvent<GenericsOf<typeof node1>> | undefined
      >()
      calls.push([event])
    })

    node1.invalidate()

    const expectedInvalidateEvent: InvalidateEvent = {
      operation: undefined,
      reasons: undefined,
      source: node1,
      type: 'invalidate',
    }

    const expectedPromiseChangeEvent: PromiseChangeEvent = {
      operation: undefined,
      reasons: [
        {
          ...expectedInvalidateEvent,
          operation: undefined,
        },
      ],
      source: node1,
      type: 'promiseChange',
    }

    // Zedux will set this to a new object reference on promise change, even
    // though the new object deep-equals the old object.
    const expectedState = {
      data: undefined,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'loading',
    }

    const expectedChangeEvent: ChangeEvent = {
      newState: expectedState,
      oldState: expectedState,
      operation: undefined,
      reasons: [
        {
          ...expectedInvalidateEvent,
          operation: undefined,
        },
      ],
      source: node1,
      type: 'change',
    }

    expect(calls).toEqual([
      [
        expectedPromiseChangeEvent,
        { promiseChange: expectedPromiseChangeEvent },
      ],
      [{ invalidate: expectedInvalidateEvent }],
      [{ promiseChange: expectedPromiseChangeEvent }],
      [{ change: expectedChangeEvent }],
    ])
  })

  test('cascade destruction sends cycle events to all destroyed nodes', () => {
    const atom1 = atom('1', 'a', { ttl: 0 })
    const atom2 = ion('2', ({ get }) => get(atom1), { ttl: 0 })

    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)

    const calls: any[] = []

    node1.on('cycle', event => {
      calls.push(['atom1', event.oldStatus, event.newStatus])
    })

    node2.on('cycle', event => {
      calls.push(['atom2', event.oldStatus, event.newStatus])
    })

    // node2 is atom1's only non-passive observer. Force-destroying node2 should:
    // 1. Remove node2's edge to atom1 (step 1 of destroyNodeFinish)
    // 2. atom1 now has only its passive listener -> atom1 gets destroyed
    // 3. atom1's cycle listener receives the Destroyed event
    // 4. node2's own destruction cycle event fires (step 4 of destroyNodeFinish)
    node2.destroy(true)

    expect(calls).toEqual([
      ['atom1', 'Active', 'Destroyed'],
      ['atom2', 'Active', 'Destroyed'],
    ])

    expect(node1.o.size).toBe(0)
    expect(node2.o.size).toBe(0)
    expect(node1.L).toBe(undefined)
    expect(node2.L).toBe(undefined)
  })

  test('change and cycle events both fire when batched together', () => {
    const atom1 = atom('1', 'a')
    const node1 = ecosystem.getNode(atom1)

    const calls: any[] = []

    node1.on('change', event => {
      calls.push(['change', event.oldState, event.newState])
    })

    node1.on('cycle', event => {
      calls.push(['cycle', event.oldStatus, event.newStatus])
    })

    // Batch a state change and a force-destroy together. The listener should
    // receive both the change event and the cycle event in the same flush.
    ecosystem.batch(() => {
      node1.set('b')
      node1.destroy(true)
    })

    expect(calls).toEqual([
      ['change', 'a', 'b'],
      ['cycle', 'Active', 'Destroyed'],
    ])

    expect(node1.o.size).toBe(0)
    expect(node1.L).toBe(undefined)
  })

  test('catch-all listener receives cycle event on destruction', () => {
    const atom1 = atom('1', 'a')
    const node1 = ecosystem.getNode(atom1)

    const calls: any[] = []

    node1.on(eventMap => {
      calls.push(Object.keys(eventMap))
    })

    node1.destroy()

    expect(calls).toEqual([['cycle']])

    expect(node1.o.size).toBe(0)
    expect(node1.L).toBe(undefined)
  })
})
