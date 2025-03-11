import { fireEvent } from '@testing-library/dom'
import { act } from '@testing-library/react'
import {
  injectAtomGetters,
  injectAtomValue,
  useAtomInstance,
  useAtomValue,
  injectAtomInstance,
  injectRef,
  AtomGetters,
  EvaluationReason,
} from '@zedux/react'
import {
  api,
  atom,
  AtomInstanceType,
  createStore,
  injectStore,
  ion,
} from '@zedux/stores'
import React from 'react'
import { ecosystem, getNodes, snapshotNodes } from '../utils/ecosystem'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { Eventless } from '@zedux/react/utils'

const atom1 = atom('atom1', () => 1)
const atom2 = atom('atom2', () => 2)
const atom3 = atom('atom3', () => 3)

const atom4 = atom('atom4', () => {
  const switchStore = injectStore(true)
  const sumStore = injectStore(0)
  const store = injectStore(() =>
    createStore({ switch: switchStore, sum: sumStore })
  )
  const { get } = injectAtomGetters()

  const one = get(atom1)
  const two = switchStore.getState() ? get(atom2) : get(atom3)

  // won't cause a reevaluation loop
  sumStore.setState(one + two)

  return api(store).setExports({
    toggle: () => switchStore.setState(val => !val),
  })
})

describe('graph', () => {
  test('injectAtomGetters', async () => {
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
    ).toEqual(['atom1', 'atom2'])

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
          atom1: expect.any(Object),
          atom3: expect.any(Object),
        },
      })
    )

    expect(ecosystem.viewGraph()).toMatchSnapshot()
    expect(ecosystem.viewGraph('bottom-up')).toMatchSnapshot()
    expect(ecosystem.viewGraph('top-down')).toMatchSnapshot()
  })

  test('getInstance(atom) returns the instance', () => {
    const evaluations: number[] = []

    const ion1 = ion('ion1', ({ getInstance }) => {
      const instance1 = getInstance(atom1)
      const instance2 = getInstance(atom2)

      evaluations.push(instance1.store.getState())

      return api(
        instance1.store.getState() + instance2.store.getState()
      ).setExports({
        set: (val: number) => getInstance(atom1).setState(val + 1),
      })
    })

    const ionInstance = ecosystem.getInstance(ion1)

    expect(ecosystem.findAll().map(({ id }) => id)).toEqual([
      'atom1',
      'atom2',
      'ion1',
    ])

    snapshotNodes()
    expect(evaluations).toEqual([1])

    ionInstance.exports.set(11)

    expect(evaluations).toEqual([1])
    expect(ionInstance.store.getState()).toBe(3)
    expect(ecosystem.getInstance(atom1).store.getState()).toBe(12)
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

    const testAtom = atom(
      'test',
      (instance: AtomInstanceType<typeof atom1>) => {
        const subRef = injectRef(false)
        const asDep = injectAtomInstance(instance) // register static dep
        const { get } = injectAtomGetters()

        if (subRef.current) get(asDep)

        return api(asDep.getState()).setExports({ subRef })
      }
    )

    const instance = ecosystem.getInstance(testAtom, [instance1])

    expect(instance.getState()).toBe(1)

    instance1.setState(2)

    expect(instance.getState()).toBe(1)

    instance.exports.subRef.current = true
    instance.invalidate()

    expect(instance.getState()).toBe(2)

    instance1.setState(3)

    expect(instance.getState()).toBe(3)
  })

  test('simultaneously-scheduled selector evaluations cause one evaluation', () => {
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    let why: EvaluationReason[] | undefined

    const selector1 = ({ get }: AtomGetters) => {
      why = ecosystem.why()
      return get(atom1) + get(atom2)
    }

    const selectorInstance = ecosystem.getNode(selector1)
    const atomInstance = ecosystem.getInstance(atom1)

    expect(selectorInstance.v).toBe('aab')
    expect(why).toHaveLength(0)

    atomInstance.setState('aa')

    expect(selectorInstance.v).toBe('aaaab')
    expect(why).toHaveLength(2)
    expect(why).toEqual([
      {
        newState: 'aa',
        oldState: 'a',
        operation: 'get',
        reasons: undefined,
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
            reasons: undefined,
            source: expect.any(Object),
            type: 'change',
          },
        ],
        source: expect.any(Object),
        type: 'change',
      },
    ])
  })
})
