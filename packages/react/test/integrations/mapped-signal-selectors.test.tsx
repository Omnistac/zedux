import {
  api,
  As,
  atom,
  Ecosystem,
  injectMappedSignal,
  injectSignal,
  ion,
  MappedSignal,
  StateOf,
} from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'
import { expectTypeOf } from 'expect-type'

describe('mapped signal selectors', () => {
  describe('map mode', () => {
    test('resolves selector state in the map', () => {
      const sourceAtom = atom('source', 'hello')

      const mySelector = ({ get }: { get: any }) => get(sourceAtom).length

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('static')

        return injectMappedSignal({
          fromSelector: selectorNode,
          fromSignal: signal,
          plain: 42,
        })
      })

      const node = ecosystem.getNode(testAtom)

      expect(node.get()).toEqual({
        fromSelector: 5,
        fromSignal: 'static',
        plain: 42,
      })
    })

    test('syncs state when selector source changes', () => {
      const sourceAtom = atom('source', 'hello')

      const mySelector = ({ get }: { get: any }) => get(sourceAtom).length

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('a')

        return injectMappedSignal({
          len: selectorNode,
          val: signal,
        })
      })

      const testNode = ecosystem.getNode(testAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      expect(testNode.get()).toEqual({ len: 5, val: 'a' })

      sourceNode.set('hello world')

      expect(testNode.get()).toEqual({ len: 11, val: 'a' })
    })

    test('.set() silently ignores selector-driven fields', () => {
      const sourceAtom = atom('source', 10)

      const mySelector = ({ get }: { get: any }) => get(sourceAtom) * 2

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('editable')

        const mapped = injectMappedSignal({
          computed: selectorNode,
          editable: signal,
        })

        return api(mapped).setExports({ mapped, signal })
      })

      const node = ecosystem.getNode(testAtom)

      expect(node.get()).toEqual({ computed: 20, editable: 'editable' })

      // set with spread - selector field should be silently ignored
      node.exports.mapped.set(state => ({
        ...state,
        editable: 'changed',
      }))

      expect(node.get()).toEqual({ computed: 20, editable: 'changed' })

      // set with explicit selector field value - should be ignored
      node.exports.mapped.set({ computed: 999, editable: 'again' })

      expect(node.get()).toEqual({ computed: 20, editable: 'again' })

      // verify the source atom didn't change
      expect(ecosystem.get(sourceAtom)).toBe(10)
    })

    test('.set() does not throw when setting selector-driven fields', () => {
      const sourceAtom = atom('source', 5)
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal({ val: selectorNode })
      })

      const node = ecosystem.getNode(testAtom)

      expect(() => {
        node.set({ val: 999 })
      }).not.toThrow()

      // selector state unchanged
      expect(node.get()).toEqual({ val: 5 })
    })

    test('.mutate() silently ignores selector-driven fields', () => {
      const sourceAtom = atom('source', { nested: 1 })

      const mySelector = ({ get }: { get: any }) => get(sourceAtom).nested

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal({ count: 0 })

        const mapped = injectMappedSignal({
          derived: selectorNode,
          data: signal,
        })

        return api(mapped).setExports({ mapped })
      })

      const node = ecosystem.getNode(testAtom)

      expect(node.get()).toEqual({ derived: 1, data: { count: 0 } })

      node.exports.mapped.mutate({ data: { count: 5 } })

      expect(node.get()).toEqual({ derived: 1, data: { count: 5 } })
    })

    test('.send() propagates events to all inner nodes including selectors', () => {
      const sourceAtom = atom('source', () => {
        return injectSignal('val', {
          events: { custom: As<string> },
        })
      })

      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('other', {
          events: { custom: As<string> },
        })

        return api(
          injectMappedSignal(
            { sel: selectorNode, sig: signal },
            { events: { custom: As<string> } }
          )
        ).setExports({ signal })
      })

      const testNode = ecosystem.getNode(testAtom)
      const selectorNode = ecosystem.getNode(mySelector)

      const selectorEvents: any[] = []
      const signalEvents: any[] = []
      const mappedEvents: any[] = []

      selectorNode.on('custom', payload => {
        selectorEvents.push(payload)
      })

      testNode.exports.signal.on('custom', payload => {
        signalEvents.push(payload)
      })

      testNode.on('custom', payload => {
        mappedEvents.push(payload)
      })

      testNode.send('custom', 'broadcast')

      expect(selectorEvents).toEqual(['broadcast'])
      expect(signalEvents).toEqual(['broadcast'])
      expect(mappedEvents).toEqual(['broadcast'])
    })

    test('event propagation from inner selector state changes up through MappedSignal', () => {
      const sourceAtom = atom('source', 'initial')

      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal({ val: selectorNode })
      })

      const testNode = ecosystem.getNode(testAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      const changes: any[] = []
      testNode.on('change', event => {
        changes.push(event.newState)
      })

      sourceNode.set('updated')

      expect(changes).toEqual([{ val: 'updated' }])
      expect(testNode.get()).toEqual({ val: 'updated' })
    })

    test('mixed signals and selectors with multiple state changes', () => {
      const atomA = atom('a', 1)
      const atomB = atom('b', 'hello')

      const selectorA = ({ get }: { get: any }) => get(atomA) * 10
      const selectorB = ({ get }: { get: any }) => get(atomB).toUpperCase()

      const testAtom = ion('test', ({ getNode }) => {
        const nodeA = getNode(selectorA)
        const nodeB = getNode(selectorB)
        const signal = injectSignal(true)

        return injectMappedSignal({
          a: nodeA,
          b: nodeB,
          flag: signal,
        })
      })

      const testNode = ecosystem.getNode(testAtom)

      expect(testNode.get()).toEqual({ a: 10, b: 'HELLO', flag: true })

      ecosystem.getNode(atomA).set(2)

      expect(testNode.get()).toEqual({ a: 20, b: 'HELLO', flag: true })

      ecosystem.getNode(atomB).set('world')

      expect(testNode.get()).toEqual({ a: 20, b: 'WORLD', flag: true })

      // set the signal field
      testNode.set(prev => ({ ...prev, flag: false }))

      expect(testNode.get()).toEqual({ a: 20, b: 'WORLD', flag: false })
    })
  })

  describe('single-signal mode wrapping a selector', () => {
    test('.get() returns selector state', () => {
      const sourceAtom = atom('source', { count: 0 })

      const mySelector = ({ get }: { get: any }) => get(sourceAtom).count

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal(selectorNode)
      })

      const node = ecosystem.getNode(testAtom)

      expect(node.get()).toBe(0)
    })

    test('state updates when selector source changes', () => {
      const sourceAtom = atom('source', 'initial')

      const mySelector = ({ get }: { get: any }) =>
        get(sourceAtom).toUpperCase()

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal(selectorNode)
      })

      const testNode = ecosystem.getNode(testAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      expect(testNode.get()).toBe('INITIAL')

      sourceNode.set('changed')

      expect(testNode.get()).toBe('CHANGED')
    })

    test('.set() is a no-op for wrapped selector', () => {
      const sourceAtom = atom('source', 42)
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal(selectorNode)
      })

      const node = ecosystem.getNode(testAtom)

      expect(node.get()).toBe(42)

      expect(() => {
        node.set(999)
      }).not.toThrow()

      // value unchanged - selector controls the state
      expect(node.get()).toBe(42)
    })

    test('.send() works on wrapped selector', () => {
      const sourceAtom = atom('source', 'val')
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal(selectorNode, {
          events: { ping: As<string> },
        })
      })

      const testNode = ecosystem.getNode(testAtom)

      const events: any[] = []
      testNode.on('ping', (payload: any) => {
        events.push(payload)
      })

      testNode.send('ping', 'pong')

      expect(events).toEqual(['pong'])
    })

    test('change events propagate from selector source through wrapped selector', () => {
      const sourceAtom = atom('source', 0)
      const mySelector = ({ get }: { get: any }) => get(sourceAtom) + 1

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        return injectMappedSignal(selectorNode)
      })

      const testNode = ecosystem.getNode(testAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      const changes: any[] = []
      testNode.on('change', (event: any) => {
        changes.push(event.newState)
      })

      sourceNode.set(5)

      expect(testNode.get()).toBe(6)
      expect(changes).toEqual([6])

      sourceNode.set(10)

      expect(testNode.get()).toBe(11)
      expect(changes).toEqual([6, 11])
    })
  })

  describe('deeply nested', () => {
    test('multiple layers of mapped signals with selectors at different levels', () => {
      const baseAtom = atom('base', { x: 1, y: 2 })

      const xSelector = ({ get }: { get: any }) => get(baseAtom).x
      const ySelector = ({ get }: { get: any }) => get(baseAtom).y

      const innerAtom = ion('inner', ({ getNode }) => {
        const xNode = getNode(xSelector)
        const signal = injectSignal('inner-val')

        return api(
          injectMappedSignal({ x: xNode, extra: signal })
        ).setExports({ signal })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        const yNode = getNode(ySelector)

        return injectMappedSignal({ inner: innerNode, y: yNode })
      })

      const outerNode = ecosystem.getNode(outerAtom)
      const baseNode = ecosystem.getNode(baseAtom)

      expect(outerNode.get()).toEqual({
        inner: { x: 1, extra: 'inner-val' },
        y: 2,
      })

      // change the base atom - both selectors should update
      baseNode.set({ x: 10, y: 20 })

      expect(outerNode.get()).toEqual({
        inner: { x: 10, extra: 'inner-val' },
        y: 20,
      })

      // change the inner signal
      const innerNode = ecosystem.getNode(innerAtom)
      innerNode.exports.signal.set('modified')

      expect(outerNode.get()).toEqual({
        inner: { x: 10, extra: 'modified' },
        y: 20,
      })
    })

    test('three layers: outer mapped -> inner mapped with selector -> source atom', () => {
      const sourceAtom = atom('source', 100)

      const derivedSelector = ({ get }: { get: any }) => get(sourceAtom) / 2

      const middleAtom = ion('middle', ({ getNode }) => {
        const derivedNode = getNode(derivedSelector)
        const localSignal = injectSignal('local')

        return api(
          injectMappedSignal({ derived: derivedNode, local: localSignal })
        ).setExports({ localSignal })
      })

      const topAtom = ion('top', ({ getNode }) => {
        const middleNode = getNode(middleAtom)
        const topSignal = injectSignal(0)

        return api(
          injectMappedSignal({ middle: middleNode, counter: topSignal })
        ).setExports({ topSignal })
      })

      const topNode = ecosystem.getNode(topAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      expect(topNode.get()).toEqual({
        middle: { derived: 50, local: 'local' },
        counter: 0,
      })

      // change propagates through all layers
      sourceNode.set(200)

      expect(topNode.get()).toEqual({
        middle: { derived: 100, local: 'local' },
        counter: 0,
      })

      // change events should propagate through all layers
      const topChanges: any[] = []
      topNode.on('change', event => {
        topChanges.push(event.newState)
      })

      sourceNode.set(400)

      expect(topNode.get()).toEqual({
        middle: { derived: 200, local: 'local' },
        counter: 0,
      })
      expect(topChanges).toEqual([
        { middle: { derived: 200, local: 'local' }, counter: 0 },
      ])
    })

    test('set on outer mapped signal does not throw with nested selector fields', () => {
      const sourceAtom = atom('source', 'a')
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const innerAtom = ion('inner', ({ getNode }) => {
        const node = getNode(mySelector)
        return injectMappedSignal({ sel: node })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        const signal = injectSignal('editable')

        return injectMappedSignal({ inner: innerNode, edit: signal })
      })

      const outerNode = ecosystem.getNode(outerAtom)

      expect(outerNode.get()).toEqual({ inner: { sel: 'a' }, edit: 'editable' })

      // setting the outer mapped signal with inner (atom-backed) field
      outerNode.set(prev => ({ ...prev, edit: 'new' }))

      expect(outerNode.get()).toEqual({ inner: { sel: 'a' }, edit: 'new' })
    })
  })

  describe('selector swapping', () => {
    test('swapping a selector instance notifies downstream when new state differs', () => {
      const atomA = atom('a', 10)
      const atomB = atom('b', 20)
      const which = atom('which', 'a' as 'a' | 'b')

      const selectorA = ({ get }: { get: any }) => get(atomA) * 2
      const selectorB = ({ get }: { get: any }) => get(atomB) * 3

      const testAtom = ion('test', ({ get, getNode }) => {
        const sel = get(which) === 'a' ? selectorA : selectorB
        const selectorNode = getNode(sel)
        const signal = injectSignal('static')

        const mapped = injectMappedSignal({
          derived: selectorNode,
          value: signal,
        })

        return api(mapped).setExports({ mapped })
      })

      const testNode = ecosystem.getNode(testAtom)
      const observerAtom = ion('observer', ({ get }) => get(testAtom).derived)
      const observerNode = ecosystem.getNode(observerAtom)

      expect(testNode.get()).toEqual({ derived: 20, value: 'static' })
      expect(observerNode.get()).toBe(20)

      const changes: any[] = []
      testNode.on('change', (e: any) => changes.push(e.newState))

      // swap selector: selectorA (10*2=20) -> selectorB (20*3=60)
      ecosystem.getNode(which).set('b')

      expect(testNode.get()).toEqual({ derived: 60, value: 'static' })
      expect(observerNode.get()).toBe(60)
      expect(changes).toEqual([{ derived: 60, value: 'static' }])
    })

    test('swapping a selector does not notify downstream when new state matches', () => {
      const atomA = atom('a', 5)
      const atomB = atom('b', 5)
      const which = atom('which', 'a' as 'a' | 'b')
      let observerEvals = 0

      // both selectors return the same value
      const selectorA = ({ get }: { get: any }) => get(atomA)
      const selectorB = ({ get }: { get: any }) => get(atomB)

      const testAtom = ion('test', ({ get, getNode }) => {
        const sel = get(which) === 'a' ? selectorA : selectorB
        const selectorNode = getNode(sel)

        return injectMappedSignal({ val: selectorNode })
      })

      const testNode = ecosystem.getNode(testAtom)
      const observerAtom = ion('observer', ({ get }) => {
        observerEvals++
        return get(testAtom).val
      })
      const observerNode = ecosystem.getNode(observerAtom)

      expect(observerNode.get()).toBe(5)
      expect(observerEvals).toBe(1)

      // swap selector ref, but both have state=5 — no downstream update
      ecosystem.getNode(which).set('b')

      expect(testNode.get()).toEqual({ val: 5 })
      expect(observerNode.get()).toBe(5)
      expect(observerEvals).toBe(1)
    })

    test('after swap, updates come from new selector and not the old one', () => {
      const atomA = atom('a', 'from-a')
      const atomB = atom('b', 'from-b')
      const which = atom('which', 'a' as 'a' | 'b')

      const selectorA = ({ get }: { get: any }) => get(atomA)
      const selectorB = ({ get }: { get: any }) => get(atomB)

      const testAtom = ion('test', ({ get, getNode }) => {
        const sel = get(which) === 'a' ? selectorA : selectorB
        const selectorNode = getNode(sel)

        return injectMappedSignal({ val: selectorNode })
      })

      const testNode = ecosystem.getNode(testAtom)

      const changes: any[] = []
      testNode.on('change', (e: any) => changes.push(e.newState))

      expect(testNode.get()).toEqual({ val: 'from-a' })

      // swap to selectorB
      ecosystem.getNode(which).set('b')
      changes.length = 0 // clear the swap change

      // update old source - should NOT affect testNode
      ecosystem.getNode(atomA).set('a-updated')

      expect(testNode.get()).toEqual({ val: 'from-b' })
      expect(changes).toEqual([])

      // update new source - SHOULD affect testNode
      ecosystem.getNode(atomB).set('b-updated')

      expect(testNode.get()).toEqual({ val: 'b-updated' })
      expect(changes).toEqual([{ val: 'b-updated' }])
    })

    test('swapping selector in single-signal wrapping mode', () => {
      const atomA = atom('a', 100)
      const atomB = atom('b', 200)
      const which = atom('which', 'a' as 'a' | 'b')

      const selectorA = ({ get }: { get: any }) => get(atomA)
      const selectorB = ({ get }: { get: any }) => get(atomB)

      const testAtom = ion('test', ({ get, getNode }) => {
        const sel = get(which) === 'a' ? selectorA : selectorB
        return injectMappedSignal(getNode(sel))
      })

      const testNode = ecosystem.getNode(testAtom)
      const observerAtom = ion('observer', ({ get }) => get(testAtom) + 1)
      const observerNode = ecosystem.getNode(observerAtom)

      expect(testNode.get()).toBe(100)
      expect(observerNode.get()).toBe(101)

      // swap
      ecosystem.getNode(which).set('b')

      expect(testNode.get()).toBe(200)
      expect(observerNode.get()).toBe(201)

      // updates from new source propagate
      ecosystem.getNode(atomB).set(300)

      expect(testNode.get()).toBe(300)
      expect(observerNode.get()).toBe(301)

      // updates from old source do NOT propagate
      ecosystem.getNode(atomA).set(999)

      expect(testNode.get()).toBe(300)
      expect(observerNode.get()).toBe(301)
    })

    test('swapping selector in atom-wrapped mapped signal propagates to outer atom observers', () => {
      const atomA = atom('a', 'val-a')
      const atomB = atom('b', 'val-b')
      const which = atom('which', 'a' as 'a' | 'b')

      const selectorA = ({ get }: { get: any }) => get(atomA)
      const selectorB = ({ get }: { get: any }) => get(atomB)

      const innerAtom = ion('inner', ({ get, getNode }) => {
        const sel = get(which) === 'a' ? selectorA : selectorB
        const selectorNode = getNode(sel)
        const signal = injectSignal('fixed')

        return injectMappedSignal({ sel: selectorNode, sig: signal })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        return injectMappedSignal(innerNode)
      })

      const outerNode = ecosystem.getNode(outerAtom)

      const outerChanges: any[] = []
      outerNode.on('change', (e: any) => outerChanges.push(e.newState))

      expect(outerNode.get()).toEqual({ sel: 'val-a', sig: 'fixed' })

      // swap the inner selector
      ecosystem.getNode(which).set('b')

      expect(outerNode.get()).toEqual({ sel: 'val-b', sig: 'fixed' })
      expect(outerChanges).toEqual([{ sel: 'val-b', sig: 'fixed' }])

      outerChanges.length = 0

      // new source updates reach outer
      ecosystem.getNode(atomB).set('val-b-updated')

      expect(outerNode.get()).toEqual({ sel: 'val-b-updated', sig: 'fixed' })
      expect(outerChanges).toEqual([{ sel: 'val-b-updated', sig: 'fixed' }])

      // old source updates do NOT reach outer
      outerChanges.length = 0
      ecosystem.getNode(atomA).set('val-a-updated')

      expect(outerNode.get()).toEqual({ sel: 'val-b-updated', sig: 'fixed' })
      expect(outerChanges).toEqual([])
    })
  })

  describe('atom wrapping propagation', () => {
    test('setting outer atom propagates through inner atom mapped signal, ignoring selectors', () => {
      const sourceAtom = atom('source', 100)
      const mySelector = ({ get }: { get: any }) => get(sourceAtom) * 2

      const innerAtom = ion('inner', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('editable')

        return api(
          injectMappedSignal({ computed: selectorNode, value: signal })
        ).setExports({ signal })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        return injectMappedSignal(innerNode)
      })

      const outerNode = ecosystem.getNode(outerAtom)
      const innerNode = ecosystem.getNode(innerAtom)

      expect(outerNode.get()).toEqual({ computed: 200, value: 'editable' })

      // set on outer atom - should propagate to innerAtom's mapped signal,
      // which forwards 'value' to the inner signal and ignores 'computed'
      outerNode.set({ computed: 999, value: 'changed' })

      expect(outerNode.get()).toEqual({ computed: 200, value: 'changed' })
      expect(innerNode.get()).toEqual({ computed: 200, value: 'changed' })
      expect(innerNode.exports.signal.getOnce()).toBe('changed')

      // verify the source atom and selector are unaffected
      expect(ecosystem.get(sourceAtom)).toBe(100)
    })

    test('send on outer atom propagates events to inner selectors', () => {
      const sourceAtom = atom('source', () => {
        return injectSignal('val', {
          events: { ping: As<string> },
        })
      })
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const innerAtom = ion('inner', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('other', {
          events: { ping: As<string> },
        })

        return injectMappedSignal(
          { sel: selectorNode, sig: signal },
          { events: { ping: As<string> } }
        )
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        return injectMappedSignal(innerNode, {
          events: { ping: As<string> },
        })
      })

      const outerNode = ecosystem.getNode(outerAtom)
      const innerNode = ecosystem.getNode(innerAtom)
      const selectorNode = ecosystem.getNode(mySelector)

      const outerEvents: any[] = []
      const innerEvents: any[] = []
      const selectorEvents: any[] = []

      outerNode.on('ping', (p: any) => outerEvents.push(p))
      innerNode.on('ping', (p: any) => innerEvents.push(p))
      selectorNode.on('ping', (p: any) => selectorEvents.push(p))

      outerNode.send('ping', 'hello')

      expect(outerEvents).toEqual(['hello'])
      expect(innerEvents).toEqual(['hello'])
      expect(selectorEvents).toEqual(['hello'])
    })

    test('source atom change propagates up through selector -> inner mapped -> outer atom', () => {
      const sourceAtom = atom('source', 'initial')
      const mySelector = ({ get }: { get: any }) => get(sourceAtom).toUpperCase()

      const innerAtom = ion('inner', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal(0)

        return injectMappedSignal({ label: selectorNode, count: signal })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        return injectMappedSignal(innerNode)
      })

      const outerNode = ecosystem.getNode(outerAtom)
      const sourceNode = ecosystem.getNode(sourceAtom)

      const outerChanges: any[] = []
      outerNode.on('change', (e: any) => outerChanges.push(e.newState))

      expect(outerNode.get()).toEqual({ label: 'INITIAL', count: 0 })

      sourceNode.set('updated')

      expect(outerNode.get()).toEqual({ label: 'UPDATED', count: 0 })
      expect(outerChanges).toEqual([{ label: 'UPDATED', count: 0 }])
    })

    test('mutate on outer atom propagates to inner signals, ignoring selectors', () => {
      const sourceAtom = atom('source', 10)
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const innerAtom = ion('inner', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal({ nested: { deep: 'val' } })

        return api(
          injectMappedSignal({ sel: selectorNode, data: signal })
        ).setExports({ signal })
      })

      const outerAtom = ion('outer', ({ getNode }) => {
        const innerNode = getNode(innerAtom)
        return injectMappedSignal(innerNode)
      })

      const outerNode = ecosystem.getNode(outerAtom)
      const innerNode = ecosystem.getNode(innerAtom)

      expect(outerNode.get()).toEqual({
        sel: 10,
        data: { nested: { deep: 'val' } },
      })

      // mutate through outer - should reach inner signal, skip selector
      outerNode.mutate({ data: { nested: { deep: 'changed' } } })

      expect(outerNode.get()).toEqual({
        sel: 10,
        data: { nested: { deep: 'changed' } },
      })
      expect(innerNode.exports.signal.getOnce()).toEqual({
        nested: { deep: 'changed' },
      })

      // selector/source unaffected
      expect(ecosystem.get(sourceAtom)).toBe(10)
    })
  })

  describe('types', () => {
    test('StateOf resolves selector state correctly in map', () => {
      const sourceAtom = atom('source', 42)
      const mySelector = ({ get }: Ecosystem) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('str')

        const mapped = injectMappedSignal({
          num: selectorNode,
          str: signal,
        })

        expectTypeOf<StateOf<typeof mapped>>().toEqualTypeOf<{
          num: number
          str: string
        }>()

        return mapped
      })

      ecosystem.getNode(testAtom)
    })

    test('StateOf resolves for single-selector wrapping', () => {
      const sourceAtom = atom('source', { nested: true })
      const mySelector = ({ get }: Ecosystem) => get(sourceAtom).nested

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const mapped = injectMappedSignal(selectorNode)

        expectTypeOf<StateOf<typeof mapped>>().toEqualTypeOf<boolean>()

        return mapped
      })

      ecosystem.getNode(testAtom)
    })

    test('set and mutate accept full state including selector fields', () => {
      const sourceAtom = atom('source', 5)
      const mySelector = ({ get }: Ecosystem) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const signal = injectSignal('a')

        const mapped = injectMappedSignal({
          computed: selectorNode,
          editable: signal,
        })

        // the callback form receives the full state
        mapped.set(state => {
          expectTypeOf(state).toEqualTypeOf<{
            computed: number
            editable: string
          }>()
          return { ...state, editable: 'b' }
        })

        return mapped
      })

      ecosystem.getNode(testAtom)
    })

    test('MappedSignal wrapping a ZeduxNode has correct type', () => {
      const sourceAtom = atom('source', 'hi')
      const mySelector = ({ get }: Ecosystem) => get(sourceAtom)

      const testAtom = ion('test', ({ getNode }) => {
        const selectorNode = getNode(mySelector)
        const mapped = injectMappedSignal(selectorNode)

        // should be a MappedSignal, not just any Signal
        expectTypeOf(mapped).toMatchTypeOf<MappedSignal>()

        return mapped
      })

      ecosystem.getNode(testAtom)
    })
  })

  describe('ZeduxNode.send()', () => {
    test('SelectorInstance has .send() method', () => {
      const sourceAtom = atom('source', 'val')
      const mySelector = ({ get }: { get: any }) => get(sourceAtom)

      const selectorNode = ecosystem.getNode(mySelector)

      expect(typeof selectorNode.send).toBe('function')

      const events: any[] = []
      selectorNode.on(eventMap => {
        events.push(eventMap)
      })

      // send should work without throwing
      selectorNode.send({ custom: 'payload' } as any)

      expect(events.length).toBe(1)
      expect(events[0].custom).toBe('payload')
    })

    test('ZeduxNode.send() schedules events correctly', () => {
      const myAtom = atom('test', 'val')
      const node = ecosystem.getNode(myAtom)

      const events: any[] = []
      node.on('change', event => {
        events.push(event)
      })

      // .send() should still work on signals (inherited from ZeduxNode now)
      node.set('new-val')

      expect(events.length).toBe(1)
      expect(events[0].newState).toBe('new-val')
    })
  })
})
