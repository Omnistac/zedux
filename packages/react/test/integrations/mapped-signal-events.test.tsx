import {
  As,
  atom,
  EventsOf,
  injectMappedSignal,
  injectSignal,
  ion,
  api,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

/**
 * Comprehensive tests for event propagation through nested MappedSignals,
 * AtomInstances, and Signals.
 *
 * Events dispatched via .send(), .set(_, events), or .mutate(_, events) need to
 * propagate:
 * - UP from inner signals through MappedSignals and AtomInstances
 * - DOWN from outer nodes to inner signals
 */

/**
 * Helper: Creates the user's exact scenario:
 *
 * listForm atom → returns MappedSignal wrapping inner signals (with custom events)
 * ptProposalFormContext ion → wraps listForm's AtomInstance in another MappedSignal
 */
const setupNestedAtomScenario = () => {
  const innerAtom = atom('inner', () => {
    const signalA = injectSignal({ count: 0 }, { events: { eventA: As<string> } })
    const signalB = injectSignal('b', { events: { eventB: As<number> } })

    const signal = injectMappedSignal(
      { a: signalA, b: signalB },
      { events: { updatedIds: As<string[]> } }
    )

    return api(signal).setExports({ signal, signalA, signalB })
  })

  const outerIon = ion('outer', ({ getNode }) => {
    const innerInstance = getNode(innerAtom)

    const signal = injectMappedSignal({ inner: innerInstance })

    return api(signal).setExports({ signal })
  })

  const innerNode = ecosystem.getNode(innerAtom)
  const outerNode = ecosystem.getNode(outerIon)

  return { innerAtom, outerIon, innerNode, outerNode }
}

describe('event propagation through nested atoms and mapped signals', () => {
  describe('upward propagation via .send()', () => {
    test('events sent on inner MappedSignal propagate to outer atom listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // send event on the inner atom's MappedSignal directly
      innerNode.exports.signal.send('updatedIds', ['id1', 'id2'])

      expect(calls).toEqual([
        ['inner updatedIds', ['id1', 'id2']],
        ['outer updatedIds', ['id1', 'id2']],
      ])
    })

    test('events sent on inner atom instance propagate to outer atom listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // send event on the inner atom instance
      innerNode.send('updatedIds', ['id1'])

      expect(calls).toEqual([
        ['inner updatedIds', ['id1']],
        ['outer updatedIds', ['id1']],
      ])
    })

    test('events sent from deepest inner signal propagate through full chain', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      innerNode.exports.signalA.on('eventA', (payload) => {
        calls.push(['signalA eventA', payload])
      })

      innerNode.exports.signal.on('eventA', (payload) => {
        calls.push(['inner signal eventA', payload])
      })

      innerNode.on('eventA', (payload) => {
        calls.push(['inner atom eventA', payload])
      })

      outerNode.on('eventA', (payload) => {
        calls.push(['outer atom eventA', payload])
      })

      // send event from the deepest inner signal
      innerNode.exports.signalA.send('eventA', 'hello')

      expect(calls).toEqual([
        ['signalA eventA', 'hello'],
        ['inner signal eventA', 'hello'],
        ['inner atom eventA', 'hello'],
        ['outer atom eventA', 'hello'],
      ])
    })

    test('events sent as object map propagate through full chain', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on(eventMap => {
        calls.push(['outer catch-all', eventMap])
      })

      innerNode.on(eventMap => {
        calls.push(['inner catch-all', eventMap])
      })

      // send event object map
      innerNode.send({ updatedIds: ['id1'], eventA: 'test' })

      expect(calls).toContainEqual(['inner catch-all', expect.objectContaining({ updatedIds: ['id1'] })])
      expect(calls).toContainEqual(['outer catch-all', expect.objectContaining({ updatedIds: ['id1'] })])
    })
  })

  describe('upward propagation via .set() with events', () => {
    test('events passed to .set() on inner MappedSignal propagate to outer listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // set with events on the inner atom's MappedSignal
      innerNode.exports.signal.set(
        { a: { count: 1 }, b: 'new' },
        { updatedIds: ['id1'] }
      )

      expect(calls).toEqual([
        ['inner updatedIds', ['id1']],
        ['outer updatedIds', ['id1']],
      ])
    })

    test('events passed to .set() on inner atom instance propagate to outer listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // set with events on the inner atom instance
      innerNode.set(
        { a: { count: 5 }, b: 'updated' },
        { updatedIds: ['id2'] }
      )

      expect(calls).toEqual([
        ['inner updatedIds', ['id2']],
        ['outer updatedIds', ['id2']],
      ])
    })

    test('events passed to .set() on inner signal propagate through full chain', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('eventA', (payload) => {
        calls.push(['outer eventA', payload])
      })

      innerNode.on('eventA', (payload) => {
        calls.push(['inner eventA', payload])
      })

      // set with events on the deepest inner signal
      innerNode.exports.signalA.set({ count: 10 }, { eventA: 'from-set' })

      expect(calls).toEqual([
        ['inner eventA', 'from-set'],
        ['outer eventA', 'from-set'],
      ])
    })
  })

  describe('upward propagation via .mutate() with events', () => {
    test('events passed to .mutate() on inner MappedSignal propagate to outer listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // mutate with events on the inner atom's MappedSignal
      innerNode.exports.signal.mutate(
        state => { state.a.count = 99 },
        { updatedIds: ['id3'] }
      )

      expect(calls).toEqual([
        ['inner updatedIds', ['id3']],
        ['outer updatedIds', ['id3']],
      ])
    })

    test('events passed to .mutate() on inner atom instance propagate to outer listeners', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('updatedIds', (payload) => {
        calls.push(['outer updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner updatedIds', payload])
      })

      // mutate with events on the inner atom instance
      innerNode.mutate(
        state => { state.a.count = 42 },
        { updatedIds: ['id4'] }
      )

      expect(calls).toEqual([
        ['inner updatedIds', ['id4']],
        ['outer updatedIds', ['id4']],
      ])
    })

    test('events passed to .mutate() on inner signal propagate through full chain', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('eventA', (payload) => {
        calls.push(['outer eventA', payload])
      })

      innerNode.on('eventA', (payload) => {
        calls.push(['inner eventA', payload])
      })

      // mutate with events on the deepest inner signal
      innerNode.exports.signalA.mutate(
        state => { state.count = 7 },
        { eventA: 'from-mutate' }
      )

      expect(calls).toEqual([
        ['inner eventA', 'from-mutate'],
        ['outer eventA', 'from-mutate'],
      ])
    })
  })

  describe('downward propagation', () => {
    test('events sent on outer atom propagate down to inner signals', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      innerNode.exports.signalA.on('eventA', (payload) => {
        calls.push(['signalA eventA', payload])
      })

      innerNode.exports.signalB.on('eventB', (payload) => {
        calls.push(['signalB eventB', payload])
      })

      innerNode.exports.signal.on('updatedIds', (payload) => {
        calls.push(['inner signal updatedIds', payload])
      })

      innerNode.on('updatedIds', (payload) => {
        calls.push(['inner atom updatedIds', payload])
      })

      // send event from the outermost atom
      outerNode.send('updatedIds', ['fromOuter'])

      // event should reach inner MappedSignal and its listeners
      expect(calls).toContainEqual(['inner signal updatedIds', ['fromOuter']])
      expect(calls).toContainEqual(['inner atom updatedIds', ['fromOuter']])
    })

    test('events sent on outer atom propagate down to deepest inner signals that handle them', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      innerNode.exports.signalA.on('eventA', (payload) => {
        calls.push(['signalA eventA', payload])
      })

      innerNode.exports.signalB.on(eventMap => {
        calls.push(['signalB catch-all', eventMap])
      })

      // send event from outermost - eventA should reach signalA
      outerNode.send('eventA', 'downward')

      expect(calls).toContainEqual(['signalA eventA', 'downward'])
    })
  })

  describe('state consistency', () => {
    test('state is correct in outer atom after inner signal state change with events', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()

      innerNode.exports.signalA.set({ count: 100 }, { eventA: 'test' })

      expect(outerNode.get()).toEqual({
        inner: { a: { count: 100 }, b: 'b' },
      })
    })

    test('state is correct after .mutate() with events on inner atom', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()

      innerNode.mutate(
        state => { state.b = 'mutated' },
        { updatedIds: ['id1'] }
      )

      expect(outerNode.get()).toEqual({
        inner: { a: { count: 0 }, b: 'mutated' },
      })
    })
  })

  describe('deduplication', () => {
    test('events reaching outer signal from multiple inner paths arrive only once', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('eventA', (payload) => {
        calls.push(payload)
      })

      // eventA is defined on signalA; send via the MappedSignal which
      // also forwards to signalB (signalB ignores unknown events)
      innerNode.send({ eventA: 'dedup-test' })

      expect(calls).toEqual(['dedup-test'])
    })
  })

  describe('single-signal wrapping event propagation', () => {
    test('events propagate through single-signal wrapping chain', () => {
      const innerAtom = atom('inner', () => {
        const signal = injectSignal('value', {
          events: { myEvent: As<string> },
        })

        const wrapped = injectMappedSignal(signal)

        return api(wrapped).setExports({ signal, wrapped })
      })

      const outerIon = ion('outer', ({ getNode }) => {
        const inner = getNode(innerAtom)
        const wrapped = injectMappedSignal(inner)

        return wrapped
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on('myEvent', (payload) => {
        calls.push(['outer', payload])
      })

      innerNode.on('myEvent', (payload) => {
        calls.push(['inner', payload])
      })

      // send from innermost signal
      innerNode.exports.signal.send('myEvent', 'hello')

      expect(calls).toEqual([
        ['inner', 'hello'],
        ['outer', 'hello'],
      ])
    })

    test('events from .set() with events propagate through single-signal wrapping', () => {
      const innerAtom = atom('inner', () => {
        const signal = injectSignal('value', {
          events: { myEvent: As<string> },
        })

        return injectMappedSignal(signal)
      })

      const outerIon = ion('outer', ({ getNode }) => {
        const inner = getNode(innerAtom)
        return injectMappedSignal(inner)
      })

      const innerNode = ecosystem.getNode(innerAtom)
      const outerNode = ecosystem.getNode(outerIon)
      const calls: any[] = []

      outerNode.on('myEvent', (payload) => {
        calls.push(['outer', payload])
      })

      innerNode.on('myEvent', (payload) => {
        calls.push(['inner', payload])
      })

      innerNode.set('newVal', { myEvent: 'from-set' })

      expect(calls).toEqual([
        ['inner', 'from-set'],
        ['outer', 'from-set'],
      ])
    })
  })

  describe('three-deep nesting', () => {
    test('events propagate through 3 levels of atom/MappedSignal nesting', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(1, { events: { ping: As<string> } })
        return injectMappedSignal(signal)
      })

      const level2 = ion('level2', ({ getNode }) => {
        const node1 = getNode(level1)
        return injectMappedSignal(node1)
      })

      const level3 = ion('level3', ({ getNode }) => {
        const node2 = getNode(level2)
        return injectMappedSignal(node2)
      })

      const node1 = ecosystem.getNode(level1)
      const node2 = ecosystem.getNode(level2)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node1.on('ping', (payload) => calls.push(['level1', payload]))
      node2.on('ping', (payload) => calls.push(['level2', payload]))
      node3.on('ping', (payload) => calls.push(['level3', payload]))

      node1.send('ping', 'from-level1')

      expect(calls).toEqual([
        ['level1', 'from-level1'],
        ['level2', 'from-level1'],
        ['level3', 'from-level1'],
      ])
    })

    test('events from .set() with events propagate through 3 levels', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(1, { events: { ping: As<string> } })
        return injectMappedSignal(signal)
      })

      const level2 = ion('level2', ({ getNode }) => {
        const node1 = getNode(level1)
        return injectMappedSignal(node1)
      })

      const level3 = ion('level3', ({ getNode }) => {
        const node2 = getNode(level2)
        return injectMappedSignal(node2)
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node3.on('ping', (payload) => calls.push(['level3', payload]))

      node1.set(10, { ping: 'from-set' })

      expect(calls).toEqual([
        ['level3', 'from-set'],
      ])
    })

    test('downward .send() propagates through 3 levels', () => {
      const level1 = atom('level1', () => {
        const signal = injectSignal(1, { events: { ping: As<string> } })
        return api(injectMappedSignal(signal)).setExports({ signal })
      })

      const level2 = ion('level2', ({ getNode }) => {
        const node1 = getNode(level1)
        return injectMappedSignal(node1)
      })

      const level3 = ion('level3', ({ getNode }) => {
        const node2 = getNode(level2)
        return injectMappedSignal(node2)
      })

      const node1 = ecosystem.getNode(level1)
      const node3 = ecosystem.getNode(level3)
      const calls: any[] = []

      node1.exports.signal.on('ping', (payload) => {
        calls.push(['innerSignal', payload])
      })

      node1.on('ping', (payload) => {
        calls.push(['level1', payload])
      })

      // send from outermost level
      node3.send('ping', 'downward')

      // should reach the deepest inner signal
      expect(calls).toContainEqual(['innerSignal', 'downward'])
      expect(calls).toContainEqual(['level1', 'downward'])
    })
  })

  describe('map-mode event propagation with atom instances', () => {
    test('events from atom-instance inner signal in map mode propagate up', () => {
      const childAtom = atom('child', () => {
        const signal = injectSignal('childVal', {
          events: { childEvent: As<number> },
        })

        return injectMappedSignal(signal)
      })

      const parentIon = ion('parent', ({ getNode }) => {
        const child = getNode(childAtom)
        const ownSignal = injectSignal('parentVal', {
          events: { parentEvent: As<boolean> },
        })

        return injectMappedSignal({ child, own: ownSignal })
      })

      const childNode = ecosystem.getNode(childAtom)
      const parentNode = ecosystem.getNode(parentIon)
      const calls: any[] = []

      parentNode.on('childEvent', (payload) => {
        calls.push(['parent childEvent', payload])
      })

      childNode.on('childEvent', (payload) => {
        calls.push(['child childEvent', payload])
      })

      childNode.send('childEvent', 42)

      expect(calls).toEqual([
        ['child childEvent', 42],
        ['parent childEvent', 42],
      ])
    })

    test('events from multiple atom-instance inner signals propagate correctly', () => {
      const childA = atom('childA', () => {
        return injectSignal('a', { events: { ping: As<string> } })
      })

      const childB = atom('childB', () => {
        return injectSignal('b', { events: { pong: As<number> } })
      })

      const parent = ion('parent', ({ getNode }) => {
        const a = getNode(childA)
        const b = getNode(childB)

        return injectMappedSignal({ a, b })
      })

      const nodeA = ecosystem.getNode(childA)
      const nodeB = ecosystem.getNode(childB)
      const parentNode = ecosystem.getNode(parent)
      const calls: any[] = []

      parentNode.on('ping', (payload) => calls.push(['parent ping', payload]))
      parentNode.on('pong', (payload) => calls.push(['parent pong', payload]))

      nodeA.send('ping', 'hello')
      nodeB.send('pong', 99)

      expect(calls).toEqual([
        ['parent ping', 'hello'],
        ['parent pong', 99],
      ])
    })
  })

  describe('no double-notification', () => {
    test('listener receives event exactly once when inner signal .set() includes events', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      let outerCount = 0
      let innerCount = 0

      outerNode.on('eventA', () => outerCount++)
      innerNode.on('eventA', () => innerCount++)

      innerNode.exports.signalA.set({ count: 10 }, { eventA: 'test' })

      expect(innerCount).toBe(1)
      expect(outerCount).toBe(1)
    })

    test('listener receives event exactly once when inner signal .mutate() includes events', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      let outerCount = 0
      let innerCount = 0

      outerNode.on('eventA', () => outerCount++)
      innerNode.on('eventA', () => innerCount++)

      innerNode.exports.signalA.mutate(
        state => { state.count = 20 },
        { eventA: 'test' }
      )

      expect(innerCount).toBe(1)
      expect(outerCount).toBe(1)
    })

    test('listener receives event exactly once when MappedSignal .send() is used', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      let count = 0

      outerNode.on('updatedIds', () => count++)

      innerNode.exports.signal.send('updatedIds', ['id1'])

      expect(count).toBe(1)
    })

    test('catch-all listener receives event exactly once per dispatch', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      let outerCount = 0

      outerNode.on(() => outerCount++)

      innerNode.send('eventA', 'test')

      expect(outerCount).toBe(1)
    })
  })

  describe('exact user scenario - no api() wrapper', () => {
    test('events propagate when atoms directly return injectMappedSignal', () => {
      // This exactly matches the user's reported pattern
      const listForm = atom('listForm', () => {
        const signalA = injectSignal({ val: 1 })
        const signalB = injectSignal({ val: 2 })

        return injectMappedSignal<
          { a: typeof signalA; b: typeof signalB },
          { updatedInstrumentIds: string[] }
        >({ a: signalA, b: signalB })
      })

      const ptProposalFormContext = ion(
        'ptProposalFormContext',
        ({ getNode }) => {
          const listFormInstance = getNode(listForm)
          const signal = injectMappedSignal({ listForm: listFormInstance })

          return signal
        }
      )

      const listFormNode = ecosystem.getNode(listForm)
      const outerNode = ecosystem.getNode(ptProposalFormContext)
      const calls: any[] = []

      outerNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['outer', payload])
      })

      listFormNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['listForm', payload])
      })

      // send via the atom instance
      listFormNode.send('updatedInstrumentIds', ['inst-1', 'inst-2'])

      expect(calls).toEqual([
        ['listForm', ['inst-1', 'inst-2']],
        ['outer', ['inst-1', 'inst-2']],
      ])
    })

    test('events from .set() with events propagate in exact user scenario', () => {
      const listForm = atom('listForm', () => {
        const signalA = injectSignal({ val: 1 })
        const signalB = injectSignal({ val: 2 })

        return injectMappedSignal<
          { a: typeof signalA; b: typeof signalB },
          { updatedInstrumentIds: string[] }
        >({ a: signalA, b: signalB })
      })

      const ptProposalFormContext = ion(
        'ptProposalFormContext',
        ({ getNode }) => {
          const listFormInstance = getNode(listForm)
          return injectMappedSignal({ listForm: listFormInstance })
        }
      )

      const listFormNode = ecosystem.getNode(listForm)
      const outerNode = ecosystem.getNode(ptProposalFormContext)
      const calls: any[] = []

      outerNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['outer', payload])
      })

      listFormNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['listForm', payload])
      })

      // set with events on listForm
      listFormNode.set(
        { a: { val: 10 }, b: { val: 20 } },
        { updatedInstrumentIds: ['inst-3'] }
      )

      expect(calls).toEqual([
        ['listForm', ['inst-3']],
        ['outer', ['inst-3']],
      ])
    })

    test('events from .mutate() with events propagate in exact user scenario', () => {
      const listForm = atom('listForm', () => {
        const signalA = injectSignal({ val: 1 })
        const signalB = injectSignal({ val: 2 })

        return injectMappedSignal<
          { a: typeof signalA; b: typeof signalB },
          { updatedInstrumentIds: string[] }
        >({ a: signalA, b: signalB })
      })

      const ptProposalFormContext = ion(
        'ptProposalFormContext',
        ({ getNode }) => {
          const listFormInstance = getNode(listForm)
          return injectMappedSignal({ listForm: listFormInstance })
        }
      )

      const listFormNode = ecosystem.getNode(listForm)
      const outerNode = ecosystem.getNode(ptProposalFormContext)
      const calls: any[] = []

      outerNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['outer', payload])
      })

      listFormNode.on('updatedInstrumentIds', (payload) => {
        calls.push(['listForm', payload])
      })

      // mutate with events on listForm
      listFormNode.mutate(
        state => { state.a.val = 99 },
        { updatedInstrumentIds: ['inst-4'] }
      )

      expect(calls).toEqual([
        ['listForm', ['inst-4']],
        ['outer', ['inst-4']],
      ])
    })
  })

  describe('edge cases', () => {
    test('events do not propagate when .set() has no state change', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('eventA', () => calls.push('outer'))
      innerNode.on('eventA', () => calls.push('inner'))

      // set the same state reference - should be a noop
      const currentState = innerNode.exports.signalA.getOnce()
      innerNode.exports.signalA.set(currentState, { eventA: 'should-not-fire' })

      expect(calls).toEqual([])
    })

    test('mutate events propagate through nested chain', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('mutate', (transactions) => {
        calls.push(['outer mutate', transactions])
      })

      innerNode.on('mutate', (transactions) => {
        calls.push(['inner mutate', transactions])
      })

      innerNode.mutate(state => {
        state.a.count = 50
      })

      // mutate events should propagate with key paths
      expect(calls.length).toBeGreaterThan(0)
      expect(calls.some(c => c[0] === 'inner mutate')).toBe(true)
      expect(calls.some(c => c[0] === 'outer mutate')).toBe(true)
    })

    test('events work after inner atom is force-destroyed and recreated', () => {
      const { innerAtom, outerIon, innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      // force-destroy the inner atom
      innerNode.destroy(true)

      // get the new instance
      const newInnerNode = ecosystem.getNode(innerAtom)
      const newOuterNode = ecosystem.getNode(outerIon)

      newOuterNode.on('updatedIds', (payload) => {
        calls.push(['outer', payload])
      })

      newInnerNode.on('updatedIds', (payload) => {
        calls.push(['inner', payload])
      })

      newInnerNode.send('updatedIds', ['after-recreate'])

      expect(calls).toEqual([
        ['inner', ['after-recreate']],
        ['outer', ['after-recreate']],
      ])
    })

    test('multiple rapid event sends all propagate', () => {
      const { innerNode, outerNode } = setupNestedAtomScenario()
      const calls: any[] = []

      outerNode.on('eventA', (payload) => calls.push(payload))

      innerNode.send('eventA', 'first')
      innerNode.send('eventA', 'second')
      innerNode.send('eventA', 'third')

      expect(calls).toEqual(['first', 'second', 'third'])
    })

    test('stale events from noop .set() do not leak into subsequent updates', () => {
      const atom1 = atom('1', () => {
        const a = injectSignal(1, { events: { custom: As<string> } })
        const signal = injectMappedSignal({ a })
        return api(signal).setExports({ signal, a })
      })

      const node = ecosystem.getNode(atom1)
      const calls: any[] = []

      node.on('custom', (payload) => calls.push(payload))

      // set with new object reference but same inner signal value - noop for
      // inner signal. Events should NOT be sent (no state change occurred).
      node.set({ a: 1 }, { custom: 'should-not-send' })

      expect(calls).toEqual([])

      // Now actually change the inner signal with its own events
      node.exports.a.set(10, { custom: 'real-event' })

      // Should only receive 'real-event', not the stale 'should-not-send'
      expect(calls).toEqual(['real-event'])
    })

    test('stale events from noop .set() do not block subsequent .send()', () => {
      const atom1 = atom('1', () => {
        const a = injectSignal(1, { events: { custom: As<string> } })
        const signal = injectMappedSignal({ a })
        return api(signal).setExports({ signal, a })
      })

      const node = ecosystem.getNode(atom1)
      const calls: any[] = []

      node.on('custom', (payload) => calls.push(payload))

      // noop set with events
      node.set({ a: 1 }, { custom: 'stale' })

      expect(calls).toEqual([])

      // send should still work correctly
      node.send('custom', 'via-send')

      expect(calls).toEqual(['via-send'])
    })

    test('events with undefined payload propagate correctly', () => {
      const testAtom = atom('test', () => {
        return injectSignal('val', { events: { noPayload: As<undefined> } })
      })

      const wrapper = ion('wrapper', ({ getNode }) => {
        return injectMappedSignal(getNode(testAtom))
      })

      const testNode = ecosystem.getNode(testAtom)
      const wrapperNode = ecosystem.getNode(wrapper)
      const calls: any[] = []

      wrapperNode.on('noPayload', (payload) => {
        calls.push(['wrapper', payload])
      })

      testNode.send('noPayload')

      expect(calls).toEqual([['wrapper', undefined]])
    })
  })

  describe('type safety', () => {
    test('outer atom inherits events from inner atom through MappedSignal wrapping', () => {
      const inner = atom('inner', () => {
        const signal = injectSignal('a', {
          events: { innerEvent: As<string> },
        })

        return injectMappedSignal(signal, {
          events: { mappedEvent: As<boolean> },
        })
      })

      const outer = ion('outer', ({ getNode }) => {
        const innerInstance = getNode(inner)
        return injectMappedSignal({ inner: innerInstance })
      })

      // verify events are correctly typed
      expectTypeOf<EventsOf<typeof outer>>().toEqualTypeOf<{
        innerEvent: string
        mappedEvent: boolean
      }>()
    })

    test('events from map-mode MappedSignal merge correctly in types', () => {
      const atomA = atom('a', () =>
        injectSignal(1, { events: { eventA: As<string> } })
      )
      const atomB = atom('b', () =>
        injectSignal(2, { events: { eventB: As<number> } })
      )

      const combined = ion('combined', ({ getNode }) => {
        const a = getNode(atomA)
        const b = getNode(atomB)

        return injectMappedSignal(
          { a, b },
          { events: { ownEvent: As<boolean> } }
        )
      })

      expectTypeOf<EventsOf<typeof combined>>().toEqualTypeOf<{
        eventA: string
        eventB: number
        ownEvent: boolean
      }>()
    })
  })
})
