import { atom, createEcosystem, ZeduxPlugin } from '@zedux/react'

describe('plugins', () => {
  test('a plugin turns on mods dynamically', () => {
    const atom1 = atom('1', () => 'a')
    const actionList: [string | undefined, string][] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['statusChanged'],
      registerEcosystem: ecosystem => {
        ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            if (!action) return

            actionList.push([action.type, action.payload?.newStatus])
          },
        })
      },
    })

    const ecosystem = createEcosystem({ id: 'test' })
    ecosystem.registerPlugin(plugin)

    const instance = ecosystem.getInstance(atom1)
    instance.setState('b')

    ecosystem.destroy(true)

    expect(actionList).toEqual([
      ['statusChanged', 'Active'],
      ['statusChanged', 'Destroyed'],
    ])
  })
})
