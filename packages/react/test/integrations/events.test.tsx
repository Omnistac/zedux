import {
  api,
  atom,
  ChangeEvent,
  CycleEvent,
  EvaluationReason,
  GenericsOf,
  InvalidateEvent,
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

    const expectedStaleEvent: CycleEvent = {
      oldStatus: 'Active',
      newStatus: 'Stale',
      operation: undefined,
      reasons: [],
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
      reasons: [],
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

    expect(node1.l).toBe('Active')

    const cleanup2 = node1.on('cycle', () => {}, { active: true })

    cleanup2()

    expect(node1.l).toBe('Destroyed')
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
})
