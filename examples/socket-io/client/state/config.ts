import { atom } from '@zedux/react'

export const apiConfigAtom = atom('apiConfig', () => {
  // change the default config based on the env:
  if (import.meta.env.MY_DEV_ENV_FLAG === 'true') {
    return { wsUrl: 'wss://my.dev.site' }
  } else if (import.meta.env.NODE_ENV !== 'production') {
    return { wsUrl: 'ws://localhost:5173' }
  }

  return { wsUrl: 'wss://my.prod.site' }
})
