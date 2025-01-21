import {
  Action,
  ActionFactoryActionType,
  atom,
  AtomGetters,
  createEcosystem,
  ion,
  ZeduxPlugin,
} from '@zedux/react'

describe('plugins', () => {
  test('a plugin turns mods on and off dynamically', () => {
    const atom1 = atom('1', () => 'a')
    const atom1Override = atom('1', () => 'b')
    const actionList: [string | undefined, string][] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['statusChanged', 'edgeCreated'],
      registerEcosystem: ecosystem => {
        ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            actionList.push([action.type, action.payload])
          },
        })
      },
    })

    const testEcosystem = createEcosystem()
    testEcosystem.registerPlugin(plugin)

    const instance1 = testEcosystem.getInstance(atom1)
    instance1.set('b')

    expect(actionList).toEqual([
      [
        'statusChanged',
        { newStatus: 'Active', node: instance1, oldStatus: 'Initializing' },
      ],
    ])
    expect(testEcosystem._mods).toMatchInlineSnapshot(`
      {
        "ecosystemWiped": 0,
        "edgeCreated": 1,
        "edgeRemoved": 0,
        "evaluationFinished": 0,
        "instanceReused": 0,
        "stateChanged": 0,
        "statusChanged": 1,
      }
    `)

    plugin.modStore.setState(['instanceReused', 'statusChanged'])

    const instance2 = testEcosystem.getInstance(atom1Override)

    testEcosystem.destroy()

    expect(actionList).toEqual([
      [
        'statusChanged',
        { newStatus: 'Active', node: instance1, oldStatus: 'Initializing' },
      ],
      ['instanceReused', { instance: instance1, template: atom1Override }],
      [
        'statusChanged',
        { newStatus: 'Destroyed', node: instance1, oldStatus: 'Active' },
      ],
    ])
    expect(testEcosystem._mods).toMatchInlineSnapshot(`
      {
        "ecosystemWiped": 0,
        "edgeCreated": 0,
        "edgeRemoved": 0,
        "evaluationFinished": 0,
        "instanceReused": 1,
        "stateChanged": 0,
        "statusChanged": 1,
      }
    `)
    expect(instance2).toBe(instance1)
  })

  test('ecosystemWiped mod triggers after all destructions', () => {
    const atom1 = atom('1', (id: string) => id)

    const payloads: any[] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['ecosystemWiped'],

      registerEcosystem: ecosystem => {
        const subscription = ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            payloads.push(action.payload)
          },
        })

        return () => subscription.unsubscribe()
      },
    })

    const testEcosystem = createEcosystem()
    testEcosystem.registerPlugin(plugin)

    const instance1 = testEcosystem.getInstance(atom1, ['a'])
    const instance2 = testEcosystem.getInstance(atom1, ['b'])

    plugin.modStore.setState(state => [...state, 'statusChanged'])

    expect(payloads).toEqual([])

    testEcosystem.destroy()

    expect(payloads).toEqual([
      {
        newStatus: 'Destroyed',
        node: instance1,
        oldStatus: 'Active',
      },
      {
        newStatus: 'Destroyed',
        node: instance2,
        oldStatus: 'Active',
      },
      {
        ecosystem: testEcosystem,
      },
    ])
  })

  test('evaluationFinished mod turns on evaluation time reporting', () => {
    const atom1 = atom('1', () => {
      const start = performance.now()
      let num = 0

      // doesn't matter, just make it take _some_ tiny amount of time for fun:
      while (performance.now() - start < 1) {
        num++
      }

      return num
    })

    const selector1 = ({ get }: AtomGetters) => get(atom1)

    const times: number[] = []

    const plugin = new ZeduxPlugin({
      registerEcosystem: ecosystem => {
        const subscription = ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            if (action.type !== ZeduxPlugin.actions.evaluationFinished.type) {
              return
            }

            times.push(
              (
                action as ActionFactoryActionType<
                  typeof ZeduxPlugin.actions.evaluationFinished
                >
              ).payload.time
            )
          },
        })

        return () => subscription.unsubscribe()
      },
    })

    plugin.modStore.setState(['evaluationFinished'])

    const testEcosystem = createEcosystem()
    testEcosystem.registerPlugin(plugin)

    const instance1 = testEcosystem.getInstance(atom1)
    instance1.destroy()
    testEcosystem.getNode(selector1)

    testEcosystem.destroy()

    expect(times).toHaveLength(3)
    expect(times[0]).toBeGreaterThan(1)
    expect(times[1]).toBeGreaterThan(1)
    expect(times[2]).toBeGreaterThan(1)
  })

  test('stateChanged and statusChanged mods receive events for atoms and selectors', () => {
    const atom1 = atom('1', 'a')
    const selector1 = ({ get }: AtomGetters) => get(atom1) + 'b'

    const updates: string[] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['stateChanged', 'statusChanged'],

      registerEcosystem: ecosystem => {
        const subscription = ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            if (action.type === ZeduxPlugin.actions.stateChanged.type) {
              updates.push(action.payload.newState)
            }

            if (
              action.type === ZeduxPlugin.actions.statusChanged.type &&
              (
                action as ActionFactoryActionType<
                  typeof ZeduxPlugin.actions.statusChanged
                >
              ).payload.newStatus === 'Active'
            ) {
              const { node } = (
                action as ActionFactoryActionType<
                  typeof ZeduxPlugin.actions.statusChanged
                >
              ).payload

              const state = node.getOnce()
              updates.push(state)
            }
          },
        })

        return () => subscription.unsubscribe()
      },
    })

    const testEcosystem = createEcosystem()

    testEcosystem.registerPlugin(plugin)

    testEcosystem.getNode(selector1)
    const instance = testEcosystem.getInstance(atom1)
    instance.set('aa')

    testEcosystem.destroy()

    expect(updates).toEqual(['a', 'ab', 'aa', 'aab'])
  })

  test('unregistering plugins cleans up mods and modBus subscriptions', () => {
    jest.useFakeTimers()
    const atom1 = atom('1', 'a')
    const atom2 = ion('2', ({ get }) => get(atom1) + 'b')

    const events: string[] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['edgeCreated', 'edgeRemoved', 'statusChanged'],

      registerEcosystem: ecosystem => {
        events.push('subscribe')
        const subscription = ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            events.push((action as Action).type)
          },
        })

        return () => {
          events.push('unsubscribe')
          subscription.unsubscribe()
        }
      },
    })

    const testEcosystem = createEcosystem()
    testEcosystem.registerPlugin(plugin)

    expect(events).toEqual(['subscribe'])

    const instance1 = testEcosystem.getInstance(atom1)
    const instance2 = testEcosystem.getInstance(atom2)

    expect(events).toEqual([
      'subscribe',
      'statusChanged', // instance1 created
      'statusChanged', // instance2 created
      'edgeCreated',
    ])

    instance1.destroy(true)
    jest.runAllTimers()

    expect(events).toEqual([
      'subscribe',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged', // instance1 force-destroyed
      'statusChanged', // instance1 recreated by instance2 (its dependent)
      'edgeCreated', // edge "moved"
    ])

    instance2.destroy()

    expect(events).toEqual([
      'subscribe',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged', // instance2 destroyed
      'edgeRemoved',
      'statusChanged', // instance1 becomes Stale 'cause it has no dependents
    ])

    testEcosystem.unregisterPlugin(plugin)

    expect(events).toEqual([
      'subscribe',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged',
      'edgeRemoved',
      'statusChanged',
      'unsubscribe',
    ])

    testEcosystem.destroy()

    expect(events).toEqual([
      'subscribe',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged',
      'statusChanged',
      'edgeCreated',
      'statusChanged',
      'edgeRemoved',
      'statusChanged',
      'unsubscribe',
    ])
  })
})
