import {
  As,
  atom,
  injectMappedSignal,
  injectSignal,
  ion,
  api,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'

/**
 * Tests that custom events dispatched alongside `signal.set()` or
 * `signal.mutate()` stay bundled with the `change` (and `mutate`) event when
 * propagating through MappedSignals. Previously, custom events and state-change
 * events were separated into distinct listener invocations at each MappedSignal
 * layer. Now they arrive together in one event map for all listeners.
 */

describe('event bundling through mapped signals', () => {
  describe('signal → mapped signal (single-signal wrapping)', () => {
    test('.set() with events: custom event arrives bundled with change', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, {
          events: { custom: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.signal.set(1, { custom: 'hello' })

      expect(calls).toEqual([['change', 'custom']])
    })

    test('.mutate() with events: custom event arrives bundled with change and mutate', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal({ count: 0 }, {
          events: { custom: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.signal.mutate(
        state => { state.count = 5 },
        { custom: 'from-mutate' }
      )

      expect(calls).toEqual([['change', 'custom', 'mutate']])
    })

    test('.mutate() without custom events: change and mutate arrive together', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal({ count: 0 })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.signal.mutate(state => { state.count = 5 })

      expect(calls).toEqual([['change', 'mutate']])
    })

    test('.send() still works as standalone event (no state change)', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, {
          events: { custom: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.signal.send('custom', 'standalone')

      // send() has no state change, so no `change` event
      expect(calls).toEqual([['custom']])
    })

    test('custom event payload is correct in bundled event map', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, {
          events: { custom: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on('custom', (payload, eventMap) => {
        calls.push({ payload, hasChange: 'change' in eventMap })
      })

      node.exports.signal.set(1, { custom: 'the-payload' })

      expect(calls).toEqual([
        { payload: 'the-payload', hasChange: true },
      ])
    })
  })

  describe('signal → mapped signal (map-mode wrapping)', () => {
    test('.set() with events on inner signal: custom event bundled with change', () => {
      const myAtom = atom('myAtom', () => {
        const a = injectSignal(0, { events: { eventA: As<string> } })
        const b = injectSignal('b')

        return api(injectMappedSignal({ a, b })).setExports({ a, b })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.a.set(1, { eventA: 'hello' })

      expect(calls).toEqual([['change', 'eventA']])
    })

    test('.mutate() with events on inner signal: all events bundled together', () => {
      const myAtom = atom('myAtom', () => {
        const a = injectSignal({ count: 0 }, { events: { eventA: As<string> } })
        const b = injectSignal('b')

        return api(injectMappedSignal({ a, b })).setExports({ a, b })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      node.exports.a.mutate(
        state => { state.count = 5 },
        { eventA: 'from-mutate' }
      )

      expect(calls).toEqual([['change', 'eventA', 'mutate']])
    })
  })

  describe('signal → atom → mapped signal (atom instance as inner signal)', () => {
    test('.set() with events on inner atom: custom event bundled with change on outer', () => {
      const innerAtom = atom('inner', () => {
        return injectSignal(0, { events: { ping: As<string> } })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(innerAtom))
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      innerNode.set(1, { ping: 'hello' })

      expect(calls).toEqual([['change', 'ping']])
    })

    test('.mutate() with events on inner atom: all events bundled on outer', () => {
      const innerAtom = atom('inner', () => {
        return injectSignal({ count: 0 }, { events: { ping: As<string> } })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(innerAtom))
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => {
        calls.push(Object.keys(eventMap).sort())
      })

      innerNode.mutate(
        state => { state.count = 5 },
        { ping: 'from-mutate' }
      )

      expect(calls).toEqual([['change', 'mutate', 'ping']])
    })
  })

  describe('two-deep nesting: signal → mapped signal → atom → mapped signal', () => {
    const setupTwoDeep = () => {
      const innerAtom = atom('inner', () => {
        const signal = injectSignal(0, {
          events: { ping: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(innerAtom))
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)

      return { innerNode, outerNode }
    }

    test('.set() with events: bundled at every layer', () => {
      const { innerNode, outerNode } = setupTwoDeep()
      const innerCalls: any[] = []
      const outerCalls: any[] = []

      innerNode.on(eventMap => {
        innerCalls.push(Object.keys(eventMap).sort())
      })

      outerNode.on(eventMap => {
        outerCalls.push(Object.keys(eventMap).sort())
      })

      innerNode.exports.signal.set(1, { ping: 'deep' })

      expect(innerCalls).toEqual([['change', 'ping']])
      expect(outerCalls).toEqual([['change', 'ping']])
    })

    test('.mutate() with events: bundled at every layer', () => {
      const innerAtom = atom('inner', () => {
        const signal = injectSignal({ count: 0 }, {
          events: { ping: As<string> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(innerAtom))
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const innerCalls: any[] = []
      const outerCalls: any[] = []

      innerNode.on(eventMap => {
        innerCalls.push(Object.keys(eventMap).sort())
      })

      outerNode.on(eventMap => {
        outerCalls.push(Object.keys(eventMap).sort())
      })

      innerNode.exports.signal.mutate(
        state => { state.count = 5 },
        { ping: 'deep-mutate' }
      )

      expect(innerCalls).toEqual([['change', 'mutate', 'ping']])
      expect(outerCalls).toEqual([['change', 'mutate', 'ping']])
    })
  })

  describe('three-deep nesting', () => {
    test('.set() with events: bundled through 3 layers of single-signal wrapping', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))

      node1.exports.signal.set(1, { ping: 'deep' })

      expect(calls.l1).toEqual([['change', 'ping']])
      expect(calls.l2).toEqual([['change', 'ping']])
      expect(calls.l3).toEqual([['change', 'ping']])
    })

    test('.mutate() with events: bundled through 3 layers of single-signal wrapping', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal({ count: 0 }, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))

      node1.exports.signal.mutate(
        state => { state.count = 42 },
        { ping: 'deep-mutate' }
      )

      expect(calls.l1).toEqual([['change', 'mutate', 'ping']])
      expect(calls.l2).toEqual([['change', 'mutate', 'ping']])
      expect(calls.l3).toEqual([['change', 'mutate', 'ping']])
    })

    test('.send() propagates standalone through 3 layers (no change event)', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node3.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      node1.exports.signal.send('ping', 'standalone')

      // send() has no state change, so no `change` or `mutate` event
      expect(calls).toEqual([['ping']])
    })
  })

  describe('three-deep with map-mode at each level', () => {
    test('.set() with events through map-mode nesting', () => {
      const level1 = atom('level1', () => {
        const a = injectSignal(0, { events: { ping: As<string> } })
        const b = injectSignal('b')
        return api(injectMappedSignal({ a, b })).setExports({ a })
      })

      const level2 = ion('level2', ({ getNode }) => {
        const l1 = getNode(level1)
        const extra = injectSignal(true)
        return injectMappedSignal({ l1, extra })
      })

      const level3 = ion('level3', ({ getNode }) => {
        const l2 = getNode(level2)
        return injectMappedSignal({ l2 })
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))

      node1.exports.a.set(1, { ping: 'deep-map' })

      expect(calls.l1).toEqual([['change', 'ping']])
      expect(calls.l2).toEqual([['change', 'ping']])
      expect(calls.l3).toEqual([['change', 'ping']])
    })

    test('.mutate() with events through map-mode nesting', () => {
      const level1 = atom('level1', () => {
        const a = injectSignal({ count: 0 }, { events: { ping: As<string> } })
        const b = injectSignal('b')
        return api(injectMappedSignal({ a, b })).setExports({ a })
      })

      const level2 = ion('level2', ({ getNode }) => {
        const l1 = getNode(level1)
        const extra = injectSignal(true)
        return injectMappedSignal({ l1, extra })
      })

      const level3 = ion('level3', ({ getNode }) => {
        const l2 = getNode(level2)
        return injectMappedSignal({ l2 })
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))

      node1.exports.a.mutate(
        state => { state.count = 42 },
        { ping: 'deep-map-mutate' }
      )

      expect(calls.l1).toEqual([['change', 'mutate', 'ping']])
      expect(calls.l2).toEqual([['change', 'mutate', 'ping']])
      expect(calls.l3).toEqual([['change', 'mutate', 'ping']])
    })
  })

  describe('mixed nesting: atoms, signals, mapped signals at different levels', () => {
    test('signal in atom → single-signal mapped signal → map-mode mapped signal → atom', () => {
      // Level 1: atom with a raw signal
      const level1 = atom('level1', () => {
        return injectSignal(0, { events: { ping: As<string> } })
      })

      // Level 2: ion wrapping level1 atom in a single-signal mapped signal
      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      // Level 3: ion wrapping level2 in a map-mode mapped signal with extra data
      const level3 = ion('level3', ({ getNode }) => {
        const l2 = getNode(level2)
        const extra = injectSignal('extra')
        return injectMappedSignal({ l2, extra })
      })

      // Level 4: ion wrapping level3 in a single-signal mapped signal
      const level4 = ion('level4', ({ getNode }) => {
        return injectMappedSignal(getNode(level3))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const node4 = ecosystem.getNode(level4)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [], l4: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))
      node4.on(eventMap => calls.l4.push(Object.keys(eventMap).sort()))

      node1.set(1, { ping: 'all-the-way' })

      expect(calls.l1).toEqual([['change', 'ping']])
      expect(calls.l2).toEqual([['change', 'ping']])
      expect(calls.l3).toEqual([['change', 'ping']])
      expect(calls.l4).toEqual([['change', 'ping']])
    })

    test('mutate through mixed nesting with custom events', () => {
      const level1 = atom('level1', () => {
        return injectSignal({ count: 0 }, { events: { ping: As<string> } })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        const l2 = getNode(level2)
        const extra = injectSignal('extra')
        return injectMappedSignal({ l2, extra })
      })

      const level4 = ion('level4', ({ getNode }) => {
        return injectMappedSignal(getNode(level3))
      })

      const node1 = ecosystem.getNode(level1)
      const node4 = ecosystem.getNode(level4)
      const calls: any[] = []

      node4.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      node1.mutate(
        state => { state.count = 42 },
        { ping: 'deep-mixed' }
      )

      expect(calls).toEqual([['change', 'mutate', 'ping']])
    })
  })

  describe('deeply nested: 5 levels of alternating single/map-mode', () => {
    test('.set() with events through 5 levels', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      // level 2: map mode
      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal({ l1: getNode(level1) })
      })

      // level 3: single-signal
      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      // level 4: map mode
      const level4 = ion('level4', ({ getNode }) => {
        return injectMappedSignal({ l3: getNode(level3) })
      })

      // level 5: single-signal
      const level5 = ion('level5', ({ getNode }) => {
        return injectMappedSignal(getNode(level4))
      })

      const node1 = ecosystem.getNode(level1)
      const node5 = ecosystem.getNode(level5)
      const calls: any[] = []

      node5.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      node1.exports.signal.set(1, { ping: 'five-deep' })

      expect(calls).toEqual([['change', 'ping']])
    })
  })

  describe('multiple custom events bundled together', () => {
    test('multiple events passed to .set() all bundle with change', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, {
          events: { eventA: As<string>, eventB: As<number> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.set(1, { eventA: 'a', eventB: 42 })

      expect(calls).toEqual([['change', 'eventA', 'eventB']])
    })

    test('multiple events passed to .mutate() all bundle with change and mutate', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal({ count: 0 }, {
          events: { eventA: As<string>, eventB: As<number> },
        })

        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.mutate(
        state => { state.count = 5 },
        { eventA: 'a', eventB: 42 }
      )

      expect(calls).toEqual([['change', 'eventA', 'eventB', 'mutate']])
    })
  })

  describe('payload integrity through layers', () => {
    test('.set() custom event payload is preserved through multiple layers', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<{ id: number }> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node3.on('ping', (payload, eventMap) => {
        calls.push({ payload, hasChange: 'change' in eventMap })
      })

      node1.exports.signal.set(1, { ping: { id: 42 } })

      expect(calls).toEqual([
        { payload: { id: 42 }, hasChange: true },
      ])
    })

    test('.mutate() custom event payload is preserved through multiple layers', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal({ count: 0 }, {
          events: { ping: As<{ ids: string[] }> },
        })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node3.on('ping', (payload, eventMap) => {
        calls.push({
          payload,
          hasChange: 'change' in eventMap,
          hasMutate: 'mutate' in eventMap,
        })
      })

      node1.exports.signal.mutate(
        state => { state.count = 99 },
        { ping: { ids: ['a', 'b'] } }
      )

      expect(calls).toEqual([
        { payload: { ids: ['a', 'b'] }, hasChange: true, hasMutate: true },
      ])
    })

    test('change event has correct old/new state at each layer', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(10, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const calls: any[] = []

      node1.on('change', change => {
        calls.push({
          layer: 'level1',
          old: change.oldState,
          new: change.newState,
        })
      })

      node2.on('change', change => {
        calls.push({
          layer: 'level2',
          old: change.oldState,
          new: change.newState,
        })
      })

      node1.exports.signal.set(20, { ping: 'test' })

      expect(calls).toEqual([
        { layer: 'level1', old: 10, new: 20 },
        { layer: 'level2', old: 10, new: 20 },
      ])
    })
  })

  describe('no double-notification with bundling', () => {
    test('single-event listener fires exactly once (not once for event, once for change)', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, { events: { custom: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      let count = 0

      outerNode.on('custom', () => count++)

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.set(1, { custom: 'test' })

      expect(count).toBe(1)
    })

    test('catch-all listener fires exactly once with all events bundled', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, { events: { custom: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      let count = 0

      outerNode.on(() => count++)

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.set(1, { custom: 'test' })

      expect(count).toBe(1)
    })

    test('through 3 levels, each catch-all listener fires exactly once', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const counts = { l1: 0, l2: 0, l3: 0 }

      node1.on(() => counts.l1++)
      node2.on(() => counts.l2++)
      node3.on(() => counts.l3++)

      node1.exports.signal.set(1, { ping: 'test' })

      expect(counts).toEqual({ l1: 1, l2: 1, l3: 1 })
    })
  })

  describe('set on mapped signal directly (this.C path)', () => {
    test('.set() with events on mapped signal directly bundles correctly', () => {
      const myAtom = atom('myAtom', () => {
        const a = injectSignal(0, { events: { eventA: As<string> } })
        return injectMappedSignal({ a })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const innerNode = ecosystem.getNode(myAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      // set on inner atom directly (goes through this.C path)
      innerNode.set({ a: 1 }, { eventA: 'direct' })

      expect(calls).toEqual([['change', 'eventA']])
    })

    test('.mutate() with events on mapped signal directly bundles correctly', () => {
      const myAtom = atom('myAtom', () => {
        const a = injectSignal({ count: 0 }, { events: { eventA: As<string> } })
        return injectMappedSignal({ a })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const innerNode = ecosystem.getNode(myAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      innerNode.mutate(
        state => { state.a.count = 99 },
        { eventA: 'direct-mutate' }
      )

      expect(calls).toEqual([['change', 'eventA', 'mutate']])
    })
  })

  describe('.send() propagation through deep nesting', () => {
    test('.send() from innermost signal propagates through 2 layers with payload', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const calls: any[] = []

      node1.on('ping', payload => calls.push(['l1', payload]))
      node2.on('ping', payload => calls.push(['l2', payload]))

      node1.exports.signal.send('ping', 'from-signal')

      expect(calls).toEqual([
        ['l1', 'from-signal'],
        ['l2', 'from-signal'],
      ])
    })

    test('.send() from innermost signal propagates through 3 layers, all listeners fire', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node1.on('ping', payload => calls.push(['l1', payload]))
      node2.on('ping', payload => calls.push(['l2', payload]))
      node3.on('ping', payload => calls.push(['l3', payload]))

      node1.exports.signal.send('ping', 'deep-send')

      expect(calls).toEqual([
        ['l1', 'deep-send'],
        ['l2', 'deep-send'],
        ['l3', 'deep-send'],
      ])
    })

    test('.send() propagates through 5 layers of alternating single/map-mode', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal({ l1: getNode(level1) })
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const level4 = ion('level4', ({ getNode }) => {
        return injectMappedSignal({ l3: getNode(level3) })
      })

      const level5 = ion('level5', ({ getNode }) => {
        return injectMappedSignal(getNode(level4))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const node4 = ecosystem.getNode(level4)
      const node5 = ecosystem.getNode(level5)
      const calls: any[] = []

      node1.on('ping', payload => calls.push(['l1', payload]))
      node2.on('ping', payload => calls.push(['l2', payload]))
      node3.on('ping', payload => calls.push(['l3', payload]))
      node4.on('ping', payload => calls.push(['l4', payload]))
      node5.on('ping', payload => calls.push(['l5', payload]))

      node1.exports.signal.send('ping', 'five-deep')

      expect(calls).toEqual([
        ['l1', 'five-deep'],
        ['l2', 'five-deep'],
        ['l3', 'five-deep'],
        ['l4', 'five-deep'],
        ['l5', 'five-deep'],
      ])
    })

    test('.send() from atom instance (not inner signal) propagates through 3 layers', () => {
      const level1 = atom('level1', () => {
        return injectSignal(0, { events: { ping: As<string> } })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node1.on('ping', payload => calls.push(['l1', payload]))
      node2.on('ping', payload => calls.push(['l2', payload]))
      node3.on('ping', payload => calls.push(['l3', payload]))

      // send on the atom instance directly (not the inner signal)
      node1.send('ping', 'from-atom')

      expect(calls).toEqual([
        ['l1', 'from-atom'],
        ['l2', 'from-atom'],
        ['l3', 'from-atom'],
      ])
    })

    test('.send() with map mode at every level propagates through 3 layers', () => {
      const level1 = atom('level1', () => {
        const a = injectSignal(0, { events: { ping: As<string> } })
        const b = injectSignal('b')
        return api(injectMappedSignal({ a, b })).setExports({ a })
      })

      const level2 = ion('level2', ({ getNode }) => {
        const l1 = getNode(level1)
        const extra = injectSignal(true)
        return injectMappedSignal({ l1, extra })
      })

      const level3 = ion('level3', ({ getNode }) => {
        const l2 = getNode(level2)
        return injectMappedSignal({ l2 })
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node1.on('ping', payload => calls.push(['l1', payload]))
      node2.on('ping', payload => calls.push(['l2', payload]))
      node3.on('ping', payload => calls.push(['l3', payload]))

      node1.exports.a.send('ping', 'map-mode-send')

      expect(calls).toEqual([
        ['l1', 'map-mode-send'],
        ['l2', 'map-mode-send'],
        ['l3', 'map-mode-send'],
      ])
    })

    test('.send() does not produce change event at any layer', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: Record<string, any[]> = { l1: [], l2: [], l3: [] }

      node1.on(eventMap => calls.l1.push(Object.keys(eventMap).sort()))
      node2.on(eventMap => calls.l2.push(Object.keys(eventMap).sort()))
      node3.on(eventMap => calls.l3.push(Object.keys(eventMap).sort()))

      node1.exports.signal.send('ping', 'no-change')

      // all layers should only see `ping`, never `change`
      expect(calls.l1).toEqual([['ping']])
      expect(calls.l2).toEqual([['ping']])
      expect(calls.l3).toEqual([['ping']])
    })

    test('.send() each listener fires exactly once through 3 layers', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const counts = { l1: 0, l2: 0, l3: 0 }

      node1.on('ping', () => counts.l1++)
      node2.on('ping', () => counts.l2++)
      node3.on('ping', () => counts.l3++)

      node1.exports.signal.send('ping', 'once')

      expect(counts).toEqual({ l1: 1, l2: 1, l3: 1 })
    })

    test('.send() with object map propagates through 3 layers', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(0, {
          events: { eventA: As<string>, eventB: As<number> },
        })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal(getNode(level2))
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node3.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      node1.exports.signal.send({ eventA: 'a', eventB: 42 })

      expect(calls).toEqual([['eventA', 'eventB']])
    })

    test('.send() payload integrity through mixed nesting (4 levels)', () => {
      const level1 = atom('level1', () => {
        return injectSignal(0, { events: { ping: As<{ id: number }> } })
      })

      const level2 = ion('level2', ({ getNode }) => {
        return injectMappedSignal(getNode(level1))
      })

      const level3 = ion('level3', ({ getNode }) => {
        return injectMappedSignal({ l2: getNode(level2) })
      })

      const level4 = ion('level4', ({ getNode }) => {
        return injectMappedSignal(getNode(level3))
      })

      const node1 = ecosystem.getNode(level1)
      const node4 = ecosystem.getNode(level4)
      const calls: any[] = []

      node4.on('ping', payload => calls.push(payload))

      node1.send('ping', { id: 99 })

      expect(calls).toEqual([{ id: 99 }])
    })
  })

  describe('edge cases', () => {
    test('set without custom events still works (only change event)', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, { events: { custom: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.set(1)

      expect(calls).toEqual([['change']])
    })

    test('mutate without custom events still works (change + mutate)', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal({ count: 0 })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      const innerNode = ecosystem.getNode(myAtom)
      innerNode.exports.signal.mutate(state => { state.count = 5 })

      expect(calls).toEqual([['change', 'mutate']])
    })

    test('noop set with events does not fire (state unchanged)', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, { events: { custom: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(eventMap))

      const innerNode = ecosystem.getNode(myAtom)
      // same value - noop
      innerNode.exports.signal.set(0, { custom: 'should-not-fire' })

      expect(calls).toEqual([])
    })

    test('buffered events do not leak into subsequent updates', () => {
      const myAtom = atom('myAtom', () => {
        const signal = injectSignal(0, { events: { custom: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        return injectMappedSignal(getNode(myAtom))
      })

      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      const innerNode = ecosystem.getNode(myAtom)

      // First: set with custom event
      innerNode.exports.signal.set(1, { custom: 'first' })

      // Second: set without custom event
      innerNode.exports.signal.set(2)

      expect(calls).toEqual([
        ['change', 'custom'], // first update has custom + change
        ['change'],           // second update has only change
      ])
    })

    test('events from different inner signals in map mode are combined', () => {
      const myAtom = atom('myAtom', () => {
        const a = injectSignal(0, { events: { eventA: As<string> } })
        const b = injectSignal(0, { events: { eventB: As<number> } })

        return api(injectMappedSignal({ a, b })).setExports({ a, b })
      })

      const node = ecosystem.getNode(myAtom)
      const calls: any[] = []

      node.on(eventMap => calls.push(Object.keys(eventMap).sort()))

      // Change both inner signals at the same time via set on the mapped signal
      node.set({ a: 1, b: 2 }, { eventA: 'a', eventB: 42 })

      expect(calls).toEqual([['change', 'eventA', 'eventB']])
    })
  })
})
