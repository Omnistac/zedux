import { fireEvent } from '@testing-library/dom'
import { act } from '@testing-library/react'
import {
  api,
  atom,
  Ecosystem,
  EvaluationReason,
  injectAtomInstance,
  injectAtomValue,
  injectEcosystem,
  injectMappedSignal,
  injectRef,
  injectSignal,
  ion,
  NodeOf,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React from 'react'
import { ecosystem, getNodes, snapshotNodes } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { Eventless } from '@zedux/react/utils'
import { mockConsole } from '../utils/console'

const atom1 = atom('atom1', () => 1)
const atom2 = atom('atom2', () => 2)
const atom3 = atom('atom3', () => 3)

const atom4 = atom('atom4', () => {
  const switchSignal = injectSignal(true)
  const sumSignal = injectSignal(0)
  const signal = injectMappedSignal({
    switch: switchSignal,
    sum: sumSignal,
  })
  const { get } = injectEcosystem()

  const one = get(atom1)
  const two = switchSignal.get() ? get(atom2) : get(atom3)

  // won't cause a reevaluation loop
  sumSignal.set(one + two)

  return api(signal).setExports({
    toggle: () => switchSignal.set(val => !val),
  })
})

describe('graph', () => {
  test('ecosystem getters', async () => {
    jest.useFakeTimers()

    function Test() {
      const { sum } = useAtomValue(atom4)
      const { toggle } = useAtomInstance(atom4).exports

      return (
        <>
          <div data-testid="sum">{sum}</div>
          <button onClick={toggle}>toggle</button>
        </>
      )
    }

    const { findByTestId, findByText } = renderInEcosystem(<Test />)

    const div = await findByTestId('sum')
    expect(div).toHaveTextContent('3')

    const expectedEdges = {
      flags: Eventless,
      operation: 'get',
    }

    const nodes = getNodes()

    expect(nodes.atom1).toEqual(
      expect.objectContaining({
        observers: {
          atom4: expectedEdges,
        },
      })
    )

    expect(nodes.atom2).toEqual(
      expect.objectContaining({
        observers: {
          atom4: expectedEdges,
        },
      })
    )

    expect(nodes.atom3).toBeUndefined()

    expect(
      [...ecosystem.n.get('atom4')!.s.keys()].map(node => node.id)
    ).toEqual([
      '@signal(atom4)-0',
      '@signal(atom4)-1',
      '@signal(atom4)-2',
      'atom1',
      'atom2',
    ])

    const button = await findByText('toggle')

    act(() => {
      fireEvent.click(button)
      jest.runAllTimers()
    })

    const nodes2 = getNodes()

    expect(div).toHaveTextContent('4')

    expect(nodes2.atom1).toEqual(
      expect.objectContaining({
        observers: {
          atom4: expectedEdges,
        },
      })
    )

    expect(nodes2.atom2).toEqual(
      expect.objectContaining({
        observers: {},
      })
    )

    expect(nodes2.atom3).toEqual(
      expect.objectContaining({
        observers: {
          atom4: expectedEdges,
        },
      })
    )

    expect(nodes2.atom4).toEqual(
      expect.objectContaining({
        sources: {
          '@signal(atom4)-0': expect.any(Object),
          '@signal(atom4)-1': expect.any(Object),
          '@signal(atom4)-2': expect.any(Object),
          atom1: expect.any(Object),
          atom3: expect.any(Object),
        },
      })
    )

    expect(ecosystem.viewGraph()).toMatchSnapshot()
    expect(ecosystem.viewGraph('bottom-up')).toMatchSnapshot()
    expect(ecosystem.viewGraph('top-down')).toMatchSnapshot()
  })

  test('getNode(atom) returns the instance', () => {
    const evaluations: number[] = []

    const ion1 = ion('ion1', ({ getNode }) => {
      const instance1 = getNode(atom1)
      const instance2 = getNode(atom2)

      evaluations.push(instance1.getOnce())

      return api(instance1.getOnce() + instance2.getOnce()).setExports({
        set: (val: number) => getNode(atom1).set(val + 1),
      })
    })

    const ionInstance = ecosystem.getNode(ion1)

    expect(ecosystem.findAll()).toEqual({
      atom1: expect.any(Object),
      atom2: expect.any(Object),
      ion1: expect.any(Object),
    })

    snapshotNodes()
    expect(evaluations).toEqual([1])

    ionInstance.exports.set(11)

    expect(evaluations).toEqual([1])
    expect(ionInstance.get()).toBe(3)
    expect(ecosystem.getNode(atom1).get()).toBe(12)
  })

  test('on reevaluation, get() updates the graph', () => {
    jest.useFakeTimers()
    let useB = true
    const atomA = atom('a', () => 'a')
    const atomB = atom('b', (param: string) => param)
    const atomC = atom('c', 'c')
    const atomD = ion('d', ({ get }) => {
      const a = injectAtomValue(atomA)
      const b = useB ? get(atomB, ['b']) : get(atomC)

      return a + b
    })

    const instance = ecosystem.getInstance(atomD)

    snapshotNodes()

    useB = false
    instance.invalidate()
    jest.runAllTimers()

    snapshotNodes()
  })

  test('atom instances can be passed as atom params', () => {
    const instance1 = ecosystem.getInstance(atom1)

    const testAtom = atom('test', (instance: NodeOf<typeof atom1>) => {
      const subRef = injectRef(false)
      const asDep = injectAtomInstance(instance) // register static dep
      const { get } = injectEcosystem()

      if (subRef.current) get(asDep)

      return api(asDep.getOnce()).setExports({ subRef })
    })

    const instance = ecosystem.getInstance(testAtom, [instance1])

    expect(instance.get()).toBe(1)

    instance1.set(2)

    expect(instance.get()).toBe(1)

    instance.exports.subRef.current = true
    instance.invalidate()

    expect(instance.get()).toBe(2)

    instance1.set(3)

    expect(instance.get()).toBe(3)
  })

  test('simultaneously-scheduled selector evaluations cause one evaluation', () => {
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    let why: EvaluationReason[] | undefined

    const selector1 = ({ get }: Ecosystem) => {
      why = ecosystem.why()
      return get(atom1) + get(atom2)
    }

    const selectorInstance = ecosystem.getNode(selector1)
    const atomInstance = ecosystem.getInstance(atom1)

    expect(selectorInstance.v).toBe('aab')
    expect(why).toHaveLength(0)

    atomInstance.set('aa')

    expect(selectorInstance.v).toBe('aaaab')
    expect(why).toHaveLength(2)
    expect(why).toEqual([
      {
        newState: 'aa',
        oldState: 'a',
        operation: 'get',
        reasons: [],
        source: expect.any(Object),
        type: 'change',
      },
      {
        newState: 'aab',
        oldState: 'ab',
        operation: 'get',
        reasons: [
          {
            newState: 'aa',
            oldState: 'a',
            operation: 'get',
            reasons: [],
            source: expect.any(Object),
            type: 'change',
          },
        ],
        source: expect.any(Object),
        type: 'change',
      },
    ])
  })

  test('signals still propagate to atom observers if atom evaluation errors', () => {
    const mock = mockConsole('error')
    const propagatingAtom = atom('propagating', () => {
      const signal = injectSignal(0)

      if (signal.get() === 1) throw new Error('test')

      return api(signal).setExports({ change: () => signal.set(1) })
    })

    const receivingAtom = atom('receiving', () =>
      injectAtomValue(propagatingAtom)
    )

    const receivingNode = ecosystem.getNode(receivingAtom)
    const propagatingNode = ecosystem.getNode(propagatingAtom)

    expect(receivingNode.get()).toBe(0)
    expect(() => propagatingNode.exports.change()).toThrowError(/test/)
    expect(receivingNode.get()).toBe(1)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
