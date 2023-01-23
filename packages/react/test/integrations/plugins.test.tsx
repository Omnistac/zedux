import { atom, createEcosystem, ZeduxPlugin } from '@zedux/react'

describe('plugins', () => {
  test('a plugin turns on mods dynamically', () => {
    const atom1 = atom('1', () => 'a')
    const actionList: [string | undefined, string][] = []

    const plugin = new ZeduxPlugin({
      initialMods: ['activeStateChanged'],
      registerEcosystem: ecosystem => {
        ecosystem.modBus.subscribe({
          effects: ({ action }) => {
            if (!action) return

            actionList.push([action.type, action.payload?.newActiveState])
          },
        })
      },
    })

    const ecosystem = createEcosystem({ id: 'test' })
    ecosystem.registerPlugin(plugin)

    const instance = ecosystem.getInstance(atom1)
    instance.setState('b')

    ecosystem.destroy()

    expect(actionList).toEqual([
      ['activeStateChanged', 'Active'],
      ['activeStateChanged', 'Destroyed'],
    ])
  })
})
