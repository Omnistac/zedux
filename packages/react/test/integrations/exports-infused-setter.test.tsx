import {
  api,
  atom,
  As,
  EventsOf,
  ExportsInfusedSetter,
  injectAtomState,
  injectSignal,
  ion,
  StateOf,
  Transaction,
} from '@zedux/atoms'
import { useAtomState } from '@zedux/react'
import { expectTypeOf } from 'expect-type'
import React, { act } from 'react'
import { ecosystem } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'

const customEvents = {
  customNum: As<number>,
  customStr: As<string>,
  customUndefined: As<undefined>,
}

type CustomEvents = {
  [K in keyof typeof customEvents]: ReturnType<(typeof customEvents)[K]>
}

describe('ExportsInfusedSetter with partial events', () => {
  describe('useAtomState', () => {
    test('setter accepts partial custom events that reach listeners', () => {
      const receivedEvents: any[] = []

      const atomWithEvents = atom('atomWithEvents', () => {
        const signal = injectSignal(0, { events: customEvents })

        return api(signal).setExports({
          double: () => signal.set(s => s * 2),
        })
      })

      let setState: ExportsInfusedSetter<
        StateOf<typeof atomWithEvents>,
        { double: () => void },
        CustomEvents
      >

      function Test() {
        const [state, setStateFn] = useAtomState(atomWithEvents)
        setState = setStateFn

        return <div data-testid="value">{state}</div>
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(atomWithEvents)

      instance.on('customNum', (payload, eventMap) => {
        receivedEvents.push({ type: 'customNum', payload, eventMap })
      })

      instance.on('customStr', (payload, eventMap) => {
        receivedEvents.push({ type: 'customStr', payload, eventMap })
      })

      instance.on('customUndefined', (payload, eventMap) => {
        receivedEvents.push({ type: 'customUndefined', payload, eventMap })
      })

      // Test setting state with a single custom event
      act(() => {
        setState(1, { customNum: 42 })
      })

      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].type).toBe('customNum')
      expect(receivedEvents[0].payload).toBe(42)
      expect(receivedEvents[0].eventMap.customNum).toBe(42)
      expect(receivedEvents[0].eventMap.change).toBeDefined()
      receivedEvents.length = 0

      // Test setting state with multiple custom events
      act(() => {
        setState(2, { customNum: 100, customStr: 'hello' })
      })

      expect(receivedEvents.length).toBe(2)
      expect(receivedEvents.find(e => e.type === 'customNum')?.payload).toBe(
        100
      )
      expect(receivedEvents.find(e => e.type === 'customStr')?.payload).toBe(
        'hello'
      )
      receivedEvents.length = 0

      // Test setting state with undefined event payload
      act(() => {
        setState(3, { customUndefined: undefined })
      })

      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].type).toBe('customUndefined')
      expect(receivedEvents[0].payload).toBe(undefined)
    })

    test('setter accepts mutate event alongside custom events', () => {
      const receivedEvents: any[] = []

      const atomWithEvents = atom('atomWithMutate', () => {
        const signal = injectSignal({ count: 0 }, { events: customEvents })

        return api(signal)
      })

      let setState: any

      function Test() {
        const [, setStateFn] = useAtomState(atomWithEvents)
        setState = setStateFn

        return null
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(atomWithEvents)

      instance.on('mutate', (payload, eventMap) => {
        receivedEvents.push({ type: 'mutate', payload, eventMap })
      })

      instance.on('customNum', (payload, eventMap) => {
        receivedEvents.push({ type: 'customNum', payload, eventMap })
      })

      const transactions: Transaction[] = [{ k: 'count', v: 5 }]

      act(() => {
        setState({ count: 5 }, { mutate: transactions, customNum: 123 })
      })

      expect(receivedEvents.length).toBe(2)
      expect(
        receivedEvents.find(e => e.type === 'mutate')?.payload
      ).toStrictEqual(transactions)
      expect(receivedEvents.find(e => e.type === 'customNum')?.payload).toBe(
        123
      )
    })

    test('TypeScript: setter has correct type for partial events', () => {
      const atomWithEvents = atom('typedAtom', () => {
        const signal = injectSignal('initial', { events: customEvents })

        return api(signal).setExports({ reset: () => signal.set('initial') })
      })

      let capturedSetState: any

      function Test() {
        const [, setState] = useAtomState(atomWithEvents)
        capturedSetState = setState

        // Type tests - these should all compile without errors
        expectTypeOf(setState).parameter(0).toMatchTypeOf<
          string | ((state: string) => string)
        >()

        expectTypeOf(setState)
          .parameter(1)
          .toMatchTypeOf<
            Partial<CustomEvents & { mutate: Transaction[] }> | undefined
          >()

        // The exports should still be accessible
        expectTypeOf(setState.reset).toBeFunction()

        return null
      }

      renderInEcosystem(<Test />)

      // Test setter calls outside of render to avoid infinite loop
      act(() => {
        // The setter should accept no events
        capturedSetState('a')

        // The setter should accept partial events (just one)
        capturedSetState('b', { customNum: 1 })

        // The setter should accept multiple partial events
        capturedSetState('c', { customNum: 1, customStr: 'test' })

        // The setter should accept mutate alongside custom events
        capturedSetState('d', { mutate: [], customNum: 5 })
      })
    })
  })

  describe('injectAtomState', () => {
    test('setter accepts partial custom events that reach listeners', () => {
      const receivedEvents: any[] = []

      const innerAtom = atom('innerAtom', () => {
        const signal = injectSignal(0, { events: customEvents })

        return api(signal).setExports({ increment: () => signal.set(s => s + 1) })
      })

      const outerAtom = atom('outerAtom', () => {
        const [, setState] = injectAtomState(innerAtom)

        return api(0).setExports({
          setInnerWithEvent: (val: number, eventPayload: number) => {
            setState(val, { customNum: eventPayload })
          },
          setInnerWithMultipleEvents: (
            val: number,
            numPayload: number,
            strPayload: string
          ) => {
            setState(val, { customNum: numPayload, customStr: strPayload })
          },
        })
      })

      const innerInstance = ecosystem.getInstance(innerAtom)
      const outerInstance = ecosystem.getInstance(outerAtom)

      innerInstance.on('customNum', (payload, eventMap) => {
        receivedEvents.push({ type: 'customNum', payload, eventMap })
      })

      innerInstance.on('customStr', (payload, eventMap) => {
        receivedEvents.push({ type: 'customStr', payload, eventMap })
      })

      // Test single event
      outerInstance.exports.setInnerWithEvent(10, 42)

      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].type).toBe('customNum')
      expect(receivedEvents[0].payload).toBe(42)
      expect(innerInstance.get()).toBe(10)
      receivedEvents.length = 0

      // Test multiple events
      outerInstance.exports.setInnerWithMultipleEvents(20, 100, 'hello')

      expect(receivedEvents.length).toBe(2)
      expect(receivedEvents.find(e => e.type === 'customNum')?.payload).toBe(
        100
      )
      expect(receivedEvents.find(e => e.type === 'customStr')?.payload).toBe(
        'hello'
      )
      expect(innerInstance.get()).toBe(20)
    })

    test('TypeScript: injectAtomState setter has correct partial events type', () => {
      const innerAtom = atom('innerTypedAtom', () => {
        const signal = injectSignal('value', { events: customEvents })

        return api(signal).setExports({ clear: () => signal.set('') })
      })

      atom('typeTestAtom', () => {
        const [state, setState] = injectAtomState(innerAtom)

        expectTypeOf(state).toBeString()

        // Type tests for the setter
        expectTypeOf(setState).parameter(0).toMatchTypeOf<
          string | ((state: string) => string)
        >()

        expectTypeOf(setState)
          .parameter(1)
          .toMatchTypeOf<
            Partial<CustomEvents & { mutate: Transaction[] }> | undefined
          >()

        // Should accept no events
        setState('a')

        // Should accept partial events
        setState('b', { customNum: 1 })
        setState('c', { customStr: 'test' })
        setState('d', { customNum: 1, customStr: 'test' })

        // Should accept mutate event
        setState('e', { mutate: [] })

        // Exports should be accessible
        expectTypeOf(setState.clear).toBeFunction()

        return 'test'
      })
    })
  })

  describe('AtomInstance#x (exportsInfusedSetter)', () => {
    test('x property setter accepts partial custom events that reach listeners', () => {
      const receivedEvents: any[] = []

      const atomWithEvents = atom('xPropertyAtom', () => {
        const signal = injectSignal(0, { events: customEvents })

        return api(signal).setExports({
          triple: () => signal.set(s => s * 3),
        })
      })

      const instance = ecosystem.getInstance(atomWithEvents)

      instance.on('customNum', (payload, eventMap) => {
        receivedEvents.push({ type: 'customNum', payload, eventMap })
      })

      instance.on('customStr', (payload, eventMap) => {
        receivedEvents.push({ type: 'customStr', payload, eventMap })
      })

      // Test using instance.x with partial events
      instance.x(5, { customNum: 999 })

      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].type).toBe('customNum')
      expect(receivedEvents[0].payload).toBe(999)
      expect(instance.get()).toBe(5)
      receivedEvents.length = 0

      // Test using instance.x with multiple partial events
      instance.x(10, { customNum: 111, customStr: 'world' })

      expect(receivedEvents.length).toBe(2)
      expect(receivedEvents.find(e => e.type === 'customNum')?.payload).toBe(
        111
      )
      expect(receivedEvents.find(e => e.type === 'customStr')?.payload).toBe(
        'world'
      )
      expect(instance.get()).toBe(10)
    })

    test('x property exports are still accessible', () => {
      const atomWithExports = atom('xExportsAtom', () => {
        const signal = injectSignal(1, { events: customEvents })

        return api(signal).setExports({
          double: () => signal.set(s => s * 2),
          getSquare: () => signal.get() ** 2,
        })
      })

      const instance = ecosystem.getInstance(atomWithExports)

      // Exports should be accessible on the x property
      expect(typeof instance.x.double).toBe('function')
      expect(typeof instance.x.getSquare).toBe('function')

      instance.x.double()
      expect(instance.get()).toBe(2)

      expect(instance.x.getSquare()).toBe(4)
    })

    test('TypeScript: instance.x has correct type for partial events', () => {
      const atomWithEvents = atom('xTypedAtom', () => {
        const signal = injectSignal({ value: 0 }, { events: customEvents })

        return api(signal).setExports({
          reset: () => signal.set({ value: 0 }),
        })
      })

      const instance = ecosystem.getInstance(atomWithEvents)

      // Type tests for instance.x
      expectTypeOf(instance.x).parameter(0).toMatchTypeOf<
        { value: number } | ((state: { value: number }) => { value: number })
      >()

      expectTypeOf(instance.x)
        .parameter(1)
        .toMatchTypeOf<
          Partial<CustomEvents & { mutate: Transaction[] }> | undefined
        >()

      // Should accept no events
      instance.x({ value: 1 })

      // Should accept partial events
      instance.x({ value: 2 }, { customNum: 1 })
      instance.x({ value: 3 }, { customStr: 'test' })
      instance.x({ value: 4 }, { customNum: 1, customStr: 'test' })

      // Should accept mutate event
      instance.x({ value: 5 }, { mutate: [] })

      // Exports should be typed correctly
      expectTypeOf(instance.x.reset).toBeFunction()
    })
  })

  describe('ion support', () => {
    test('ion with custom events works with useAtomState', () => {
      const receivedEvents: any[] = []

      const ionWithEvents = ion('ionWithEvents', () => {
        const signal = injectSignal('initial', { events: customEvents })

        return api(signal).setExports({ toUpper: () => signal.set(s => s.toUpperCase()) })
      })

      let setState: any

      function Test() {
        const [, setStateFn] = useAtomState(ionWithEvents)
        setState = setStateFn

        return null
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(ionWithEvents)

      instance.on('customNum', payload => {
        receivedEvents.push({ type: 'customNum', payload })
      })

      act(() => {
        setState('updated', { customNum: 777 })
      })

      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].payload).toBe(777)
      expect(instance.get()).toBe('updated')
    })
  })

  describe('edge cases', () => {
    test('setter works without events parameter', () => {
      const atomNoEvents = atom('atomNoEvents', () => {
        const signal = injectSignal(0, { events: customEvents })

        return api(signal)
      })

      let setState: any

      function Test() {
        const [, setStateFn] = useAtomState(atomNoEvents)
        setState = setStateFn

        return null
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(atomNoEvents)

      // Should work without events
      act(() => {
        setState(42)
      })

      expect(instance.get()).toBe(42)
    })

    test('setter works with empty events object', () => {
      const receivedEvents: any[] = []

      const atomEmptyEvents = atom('atomEmptyEvents', () => {
        const signal = injectSignal(0, { events: customEvents })

        return api(signal)
      })

      let setState: any

      function Test() {
        const [, setStateFn] = useAtomState(atomEmptyEvents)
        setState = setStateFn

        return null
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(atomEmptyEvents)

      instance.on('change', event => {
        receivedEvents.push(event)
      })

      // Should work with empty events object
      act(() => {
        setState(100, {})
      })

      expect(instance.get()).toBe(100)
      // Change event should still fire
      expect(receivedEvents.length).toBe(1)
    })

    test('function setter works with partial events', () => {
      const receivedEvents: any[] = []

      const atomFnSetter = atom('atomFnSetter', () => {
        const signal = injectSignal(10, { events: customEvents })

        return api(signal)
      })

      let setState: any

      function Test() {
        const [, setStateFn] = useAtomState(atomFnSetter)
        setState = setStateFn

        return null
      }

      renderInEcosystem(<Test />)

      const instance = ecosystem.getInstance(atomFnSetter)

      instance.on('customNum', payload => {
        receivedEvents.push(payload)
      })

      // Use function form of setter with events
      act(() => {
        setState((prev: number) => prev + 5, { customNum: 555 })
      })

      expect(instance.get()).toBe(15)
      expect(receivedEvents[0]).toBe(555)
    })

    test('events type is inferred correctly for atoms without custom events', () => {
      const simpleAtom = atom('simpleAtom', () => {
        return api(injectSignal(0)).setExports({ inc: () => {} })
      })

      const instance = ecosystem.getInstance(simpleAtom)

      // For atoms without custom events, only ExplicitEvents should be available
      expectTypeOf(instance.x)
        .parameter(1)
        .toMatchTypeOf<Partial<{ mutate: Transaction[] }> | undefined>()

      // EventsOf should be empty record for atoms without custom events
      expectTypeOf<EventsOf<typeof simpleAtom>>().toEqualTypeOf<
        Record<never, never>
      >()
    })
  })
})
