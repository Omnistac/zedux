import { atom, injectStore, Mod, ZeduxPlugin } from '@zedux/react'

const defaultMods = Object.keys(ZeduxPlugin.actions).reduce((obj, mod) => {
  obj[mod as Mod] = true
  return obj
}, {} as Record<Mod, boolean>)

export const monitor = atom('monitor', () => {
  const store = injectStore<{
    settings: Record<Mod, boolean> & { history: number }
  }>({
    settings: {
      history: 300,
      ...defaultMods,
    },
  })

  return store
})
