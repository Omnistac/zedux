import React from 'react'

import { atom, injectEffect, injectStore } from '@zedux/react'

const secondsAtom = atom('seconds', () => {
  const store = injectStore(0)

  injectEffect(() => {
    const handle = setInterval(() => store.setState(state => state + 1), 1000)

    return () => clearInterval(handle)
  }, [])

  return store
})
