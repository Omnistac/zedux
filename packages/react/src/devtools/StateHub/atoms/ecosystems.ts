import { atom, injectEffect, injectStore, zeduxGlobalStore } from '@zedux/react'

export const ecosystems = atom('ecosystems', () => {
  const store = injectStore(
    Object.keys(zeduxGlobalStore.getState().ecosystems).sort()
  )

  injectEffect(() => {
    // add any ecosystems that were created between atom evaluation and this
    // effect running
    store.setState(Object.keys(zeduxGlobalStore.getState().ecosystems).sort())

    const subscription = zeduxGlobalStore.subscribe(newState => {
      // have to defer this call since the zeduxGlobalStore state can update
      // during render
      setTimeout(() => {
        store.setState(Object.keys(newState.ecosystems).sort())
      })
    })

    return () => subscription.unsubscribe()
  })

  return store
})
