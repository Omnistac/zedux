import { api, atom, injectStore } from '@zedux/react'

export interface Toast {
  description: string
  title: string
  ttl?: number | Promise<any>
  type: 'error' | 'info' | 'warning'
}

const interpolation = atom('interpolation', (...args: any) => {
  return ''
})

export const toasts = atom('toasts', () => {
  const store = injectStore<Toast[]>([])

  const setupNextTtl = () => {
    const [toast] = store.getState()
    if (!toast || toast.ttl === 0) return

    const ttl = toast.ttl || 5000

    if (typeof ttl === 'number') {
      // sure, just leak this timeout. The only danger is that it could keep
      // this atom instance's store around for a bit after this instance is
      // destroyed. Then it would update the state of the dead store. But then
      // the store would go out of scope and be garbage collected. All good.
      return setTimeout(() => {
        hideToast()
      }, ttl)
    }

    // minimum toast-showing duration is 3 seconds. Set a timeout in case the promise resolves before then
    setTimeout(() => {
      ttl.then(() => {
        hideToast()
      })
    }, 3000)
  }

  const hideToast = () => {
    store.setState(state => state.slice(1))
    setupNextTtl()
  }

  const showToast = (toast: Toast) => {
    store.setState(state => [...state, toast])

    // showToast only sets up ttl if it just added the first toast to the queue
    if (store.getState().length === 1) setupNextTtl()
  }

  return api(store).setExports({
    hideToast,
    showToast,
  })
})
