import {
  api,
  atom,
  AtomGetters,
  AtomInstance,
  ChangeEvent,
  createEcosystem,
  ZeduxNode,
  injectMappedSignal,
  ion,
} from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'
import { mockConsole } from '../utils/console'

const atom1 = atom('1', () => ({ a: 1 }))
const atom1Override = atom('1', () => 'b')
const atom2 = ion('2', ({ getNode }) =>
  injectMappedSignal({ a: getNode(atom1), b: 2 })
)

afterEach(() => {
  ecosystem.C = Object.fromEntries(
    Object.keys(ecosystem.C).map(key => [key, 0])
  ) as typeof ecosystem.C
  ecosystem.L = []
})

describe('plugins', () => {
  test('ecosystem events fire only when there are ecosystem event listeners', () => {
    jest.useFakeTimers()
    const ecosystemJobFn = jest.spyOn(ecosystem, 'j')
    const node1 = ecosystem.getNode(atom1)
    const calls: any[] = []

    expect(ecosystemJobFn).not.toHaveBeenCalled()

    const cleanup = ecosystem.on(eventMap => {
      calls.push(Object.keys(eventMap))
    })

    node1.set({ a: 11 })

    expect(ecosystemJobFn).toHaveBeenCalledTimes(1)
    expect(calls).toEqual([['change']])

    node1.mutate(state => {
      state.a = 111
    })

    expect(ecosystemJobFn).toHaveBeenCalledTimes(2)
    expect(calls).toEqual([['change'], ['mutate', 'change']])

    cleanup()

    node1.set({ a: 1 })

    expect(ecosystemJobFn).toHaveBeenCalledTimes(2)
  })

  test('overrides fire cycle events', () => {
    jest.useFakeTimers()
    const calls: any[] = []

    const cleanup = ecosystem.on('cycle', event => {
      calls.push(['cycle', event.source?.id, event.oldStatus, event.newStatus])
    })

    ecosystem.getNode(atom1)
    jest.runAllTimers()

    expect(calls).toEqual([['cycle', '1', 'Initializing', 'Active']])
    calls.splice(0, 1)

    ecosystem.setOverrides([atom1Override])
    jest.runAllTimers()

    expect(calls).toEqual([['cycle', '1', 'Active', 'Destroyed']])
    calls.splice(0, 1)

    cleanup()

    ecosystem.on(eventMap => {
      if (eventMap.cycle) {
        calls.push([
          'cycle',
          eventMap.cycle.source?.id,
          eventMap.cycle.oldStatus,
          eventMap.cycle.newStatus,
        ])
      }
    })

    ecosystem.getNode(atom1)
    jest.runAllTimers()

    expect(calls).toEqual([['cycle', '1', 'Initializing', 'Active']])
    calls.splice(0, 1)

    ecosystem.removeOverrides([atom1Override])

    expect(calls).toEqual([['cycle', '1', 'Active', 'Destroyed']])
  })

  test('change event', () => {
    const selector1 = ({ get }: AtomGetters) => get(atom1).a * 2
    const node2 = ecosystem.getNode(atom2)
    const selectorNode1 = ecosystem.getNode(selector1)
    const calls: any[] = []

    expect(selectorNode1.v).toBe(2)

    const cleanup = ecosystem.on('change', event => {
      expectTypeOf(event).toEqualTypeOf<ChangeEvent>()
      calls.push([event.source?.id, event.newState])
    })

    node2.set(state => ({ ...state, a: { ...state.a, a: 11 } }))

    expect(selectorNode1.v).toBe(22)

    expect(calls).toEqual([
      ['1', { a: 11 }],
      ['@selector(selector1)-2', 22],
      ['@signal(2)-1', { a: { a: 11 }, b: 2 }],
      ['2', { a: { a: 11 }, b: 2 }],
    ])
    calls.splice(0, calls.length)

    cleanup()

    node2.mutate({ b: 22 })

    expect(calls).toEqual([])

    ecosystem.on(eventMap => {
      if (eventMap.change) {
        calls.push([eventMap.change.source?.id, eventMap.change.newState])
      }
    })

    node2.mutate({ b: 222 })

    expect(calls).toEqual([
      ['@signal(2)-1', { a: { a: 11 }, b: 222 }],
      ['2', { a: { a: 11 }, b: 222 }],
    ])
  })

  test('edge event', () => {
    jest.useFakeTimers()
    const calls: any[] = []

    const cleanup = ecosystem.on('edge', event => {
      calls.push([event.action, event.observer.id, event.source.id])
    })

    const node2 = ecosystem.getNode(atom2)
    jest.runAllTimers()

    expect(calls).toEqual([
      ['add', '@signal(2)-1', '1'],
      ['add', '2', '1'],
      ['add', '2', '@signal(2)-1'],
    ])
    calls.splice(0, calls.length)

    cleanup()

    node2.destroy()

    expect(calls).toEqual([])

    let isDynamic = true
    const changingAtom = ion('changing', ({ get, getNode }) => {
      return isDynamic ? get(atom1) : getNode(atom1).getOnce()
    })

    ecosystem.on(eventMap => {
      if (eventMap.edge) {
        calls.push([
          eventMap.edge.action,
          eventMap.edge.observer.id,
          eventMap.edge.source.id,
        ])
      }

      if (eventMap.invalidate) {
        calls.push(['invalidate', eventMap.invalidate.source?.id])
      }
    })

    const changingNode = ecosystem.getNode(changingAtom)
    jest.runAllTimers()

    expect(calls).toEqual([['add', 'changing', '1']])
    calls.splice(0, calls.length)

    isDynamic = false
    changingNode.invalidate()

    expect(calls).toEqual([
      ['invalidate', 'changing'],
      ['update', 'changing', '1'],
    ])
    calls.splice(0, calls.length)

    changingNode.destroy()

    expect(calls).toEqual([['remove', 'changing', '1']])
  })

  test('error event', async () => {
    jest.useFakeTimers()

    const errorAtom = atom('errorAtom', () => {
      throw new Error('error')
    })

    const mappedSignal = ion('mappedSignal', ({ get }) =>
      injectMappedSignal({
        error: get(errorAtom),
      })
    )

    const errorSelector = () => {
      throw 'not an error'
    }

    const errorPromise = atom('errorPromise', () => {
      return api(Promise.reject('reject'))
    })

    const calls: any[] = []
    const consoleSpy = mockConsole('error')

    const cleanup = ecosystem.on('error', event => {
      calls.push([event.source.id, event.error.message])
    })

    expect(() => ecosystem.getNode(errorAtom)).toThrowError('error')
    expect(() => ecosystem.getNode(mappedSignal)).toThrowError('error')
    expect(() => ecosystem.getNode(errorSelector)).toThrowError('not an error')
    const promiseNode = ecosystem.getNode(errorPromise)
    jest.runAllTimers()
    await Promise.resolve().then()

    const expectedCalls = [
      ['errorAtom', 'error'],
      ['errorAtom', 'error'],
      ['mappedSignal', 'error'],
      ['@selector(errorSelector)-1', 'not an error'],
      ['errorPromise', 'reject'],
    ]

    expect(calls).toEqual(expectedCalls)
    calls.splice(0, calls.length)

    expect(consoleSpy).toHaveBeenCalledTimes(4)

    cleanup()
    promiseNode.destroy()

    ecosystem.on(eventMap => {
      if (eventMap.error) {
        calls.push([eventMap.error.source.id, eventMap.error.error.message])
      }
    })

    expect(() => ecosystem.getNode(errorAtom)).toThrowError('error')
    expect(() => ecosystem.getNode(mappedSignal)).toThrowError('error')
    expect(() => ecosystem.getNode(errorSelector)).toThrowError('not an error')
    ecosystem.getNode(errorPromise)
    jest.runAllTimers()
    await Promise.resolve().then()

    expect(calls).toEqual(expectedCalls)

    expect(consoleSpy).toHaveBeenCalledTimes(8)
  })

  test('promiseChange event', () => {
    jest.useFakeTimers()
    const calls: any[] = []
    const promiseA = Promise.resolve('a')
    const promiseB = Promise.resolve('b')
    let useA = true

    const promiseAtom = atom('promiseAtom', () =>
      api(useA ? promiseA : promiseB)
    )

    const cleanup = ecosystem.on('promiseChange', event => {
      calls.push([event.source?.id, (event.source as AtomInstance)?.promise])
    })

    const promiseNode = ecosystem.getNode(promiseAtom)
    jest.runAllTimers()

    expect(calls).toEqual([['promiseAtom', promiseA]])
    calls.splice(0, calls.length)

    cleanup()

    ecosystem.on(eventMap => {
      if (eventMap.promiseChange) {
        calls.push([
          eventMap.promiseChange.source?.id,
          (eventMap.promiseChange.source as AtomInstance)?.promise,
        ])
      }

      if (eventMap.invalidate) {
        calls.push(['invalidate', eventMap.invalidate.source?.id])
      }
    })

    useA = false
    promiseNode.invalidate()
    jest.runAllTimers()

    expect(calls).toEqual([
      ['invalidate', 'promiseAtom'],
      ['promiseAtom', promiseB],
    ])
  })

  test('resetStart and resetEnd events', () => {
    const calls: any[] = []
    const testEcosystem = createEcosystem({ id: 'reset-event-test' })
    testEcosystem.getNode(atom1)

    const cleanup = testEcosystem.on(eventMap => {
      calls.push(Object.keys(eventMap))
    })

    testEcosystem.reset()

    expect(calls).toEqual([['resetStart'], ['cycle'], ['resetEnd']])
    calls.splice(0, calls.length)

    testEcosystem.reset()

    expect(calls).toEqual([['resetStart'], ['resetEnd']])
    calls.splice(0, calls.length)

    testEcosystem.getNode(atom1)
    testEcosystem.reset()

    expect(calls).toEqual([
      ['runStart'],
      ['runEnd'],
      ['cycle'],
      ['resetStart'],
      ['cycle'],
      ['resetEnd'],
    ])
    calls.splice(0, calls.length)

    cleanup()

    testEcosystem.on('resetStart', event => {
      expectTypeOf(event).toEqualTypeOf<{
        hydration?: boolean
        listeners?: boolean
        overrides?: boolean
        type: 'resetStart'
      }>()
      calls.push(event)
    })

    testEcosystem.on('resetEnd', event => {
      expectTypeOf(event).toEqualTypeOf<{
        hydration?: boolean
        listeners?: boolean
        overrides?: boolean
        type: 'resetEnd'
      }>()
      calls.push(event)
    })

    testEcosystem.getNode(atom1)
    testEcosystem.reset({ overrides: true }) // just for fun

    expect(calls).toEqual([
      {
        hydration: undefined,
        listeners: undefined,
        overrides: true,
        type: 'resetStart',
      },
      {
        hydration: undefined,
        listeners: undefined,
        overrides: true,
        type: 'resetEnd',
      },
    ])
    calls.splice(0, calls.length)

    testEcosystem.getNode(atom1)
    testEcosystem.reset()

    expect(calls).toEqual([
      {
        hydration: undefined,
        listeners: undefined,
        overrides: undefined,
        type: 'resetStart',
      },
      {
        hydration: undefined,
        listeners: undefined,
        overrides: undefined,
        type: 'resetEnd',
      },
    ])
    calls.splice(0, calls.length)
  })

  test('runStart and runEnd events', () => {
    const node1 = ecosystem.getNode(atom1)
    const node2 = ecosystem.getNode(atom2)
    const calls: any[] = []

    const cleanup = ecosystem.on(eventMap => {
      if (eventMap.runStart || eventMap.runEnd) {
        calls.push([
          (eventMap.runStart || eventMap.runEnd)?.source.id,
          (eventMap.runStart || eventMap.runEnd)?.type,
        ])
      }
    })

    node1.set({ a: 11 })

    const expectedCalls = [
      ['2', 'runStart'],
      ['@signal(2)-1', 'runStart'],
      ['@signal(2)-1', 'runEnd'],
      ['2', 'runEnd'],
    ]

    expect(calls).toEqual(expectedCalls)
    calls.splice(0, calls.length)

    cleanup()

    ecosystem.on('runStart', event => {
      expectTypeOf(event).toEqualTypeOf<{
        source: ZeduxNode
        type: 'runStart'
      }>()

      calls.push([event.source.id, event.type])
    })

    ecosystem.on('runEnd', event => {
      expectTypeOf(event).toEqualTypeOf<{
        source: ZeduxNode
        type: 'runEnd'
      }>()

      calls.push([event.source.id, event.type])
    })

    node2.mutate(state => {
      state.a.a = 111
      state.b = 22
    })

    expect(calls).toEqual(expectedCalls)
  })

  test('change listeners can detect `mutate` events', () => {
    const calls: any[] = []
    const signal = ecosystem.signal({ a: 1 })

    ecosystem.on('change', (event, eventMap) => {
      calls.push(eventMap.mutate)
    })

    signal.mutate(state => {
      state.a = 2
    })

    expect(calls).toEqual([[{ k: 'a', v: 2 }]])
  })
})
