import type { AnyRouter } from '@tanstack/react-router'
import React from 'react'
import {
  AtomInstance,
  type Ecosystem,
  EcosystemProvider,
  is,
} from '@zedux/react'
import { Fragment } from 'react'
import { routeAtom } from './routeAtom'

export type AttachEcosystemOptions<TRouter extends AnyRouter> = {
  ecosystem: Ecosystem
  router: TRouter
  shouldDehydrateAtom?: (atom: AtomInstance) => boolean
  syncRouteAtom?: boolean
  wrapEcosystem?: boolean
}

/**
 * The recommended way to attach a Zedux ecosystem to a TanStack React Router.
 * Call this in your `router.tsx` file, right after creating the router
 * instance. Example:
 *
 * ```tsx
 * const ecosystem = createEcosystem({ ssr: typeof window === 'undefined' })
 *
 * const router = createRouter({
 *   context: { ecosystem },
 *   routeTree,
 *   scrollRestoration: true,
 * })
 *
 * attachEcosystem({ router, ecosystem })
 * ```
 */
export function attachEcosystem<TRouter extends AnyRouter>(
  opts: AttachEcosystemOptions<TRouter>
) {
  if (opts.syncRouteAtom) {
    syncRouteAtom(opts)
  }

  wrapRouter(opts)

  if (opts.wrapEcosystem === false) {
    return
  }
  const Wrap = opts.router.options.Wrap || Fragment

  opts.router.options.Wrap = function WrapImpl({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <EcosystemProvider ecosystem={opts.ecosystem}>
        <Wrap>{children}</Wrap>
      </EcosystemProvider>
    )
  }
}

type DehydratedEcosystem = {
  dehydratedAt?: number
  state: Record<string, any>
}

type DehydratedRouterAtomState = {
  dehydratedEcosystem?: DehydratedEcosystem
  atomsStream: ReadableStream<DehydratedEcosystem>
}

export function syncRouteAtom<TRouter extends AnyRouter>({
  router,
  ecosystem,
}: AttachEcosystemOptions<TRouter>) {
  const { routerRef, historyRef, navigateRef, updateRouterState } =
    ecosystem.getNode(routeAtom).exports

  // updateRouterState(router.__store.state as any);
  routerRef.current = router
  navigateRef.current = router.navigate

  historyRef.current = {
    back: () => router.history.back(),
    forward: () => router.history.forward(),
    go: (n: number) => router.history.go(n),
    push: (href: string) => router.history.push(href),
    replace: (href: string) => router.history.replace(href),
  }

  router.__store.subscribe(event => {
    updateRouterState(event.currentVal)
  })
}

export function wrapRouter<TRouter extends AnyRouter>({
  router,
  ecosystem,
  shouldDehydrateAtom,
}: AttachEcosystemOptions<TRouter>) {
  const originalHydrate = router.options.hydrate
  const originalDehydrate = router.options.dehydrate

  if (router.isServer) {
    const sentIds = new Set<string>()
    const atomsStream = createPushableStream()

    router.options.dehydrate = async (): Promise<DehydratedRouterAtomState> => {
      router.serverSsr?.onRenderFinished(() => atomsStream.close())

      const dehydratedRouter = {
        ...(await originalDehydrate?.()),
        // prepare the stream for queries coming up during rendering
        atomsStream: atomsStream.stream,
      }

      const dehydratedEcosystem: DehydratedEcosystem = {
        dehydratedAt: Date.now(),
        state: {},
      }

      try {
        dehydratedEcosystem.state = ecosystem
          .findAll('@atom')
          .reduce((acc, atom) => {
            if (!atom.template.tags?.includes('unserializable')) {
              acc[atom.id] = atom.d({ transform: true })
            }
            return acc
          }, {} as Record<string, any>)
      } catch (error) {
        console.error('Error dehydrating ecosystem:', error)
      }

      const dehydrationEntries = Object.entries(dehydratedEcosystem.state)

      if (dehydrationEntries.length) {
        for (const [id, value] of dehydrationEntries) {
          if (
            shouldDehydrateAtom &&
            !shouldDehydrateAtom(ecosystem.n.get(id) as AtomInstance)
          ) {
            delete dehydratedEcosystem.state[id]
            continue
          }

          sentIds.add(id)
          atomsStream.enqueue(value)
        }

        dehydratedRouter.dehydratedEcosystem = dehydratedEcosystem
      }

      return dehydratedRouter
    }

    ecosystem.on(async eventMap => {
      if (
        !eventMap.change &&
        (!eventMap.cycle || eventMap.cycle.newStatus !== 'Active')
      ) {
        return
      }

      const event = eventMap.change ?? eventMap.cycle

      if (!event || !is(event.source, AtomInstance)) {
        return
      }

      const instance = event.source as AtomInstance

      // before rendering starts, we do not stream individual queries
      // instead we dehydrate the entire ecosystem in router's dehydrate()
      // if attachRouterServerSsrUtils() has not been called yet, `router.serverSsr` will be undefined and we also do not stream
      if (!router.serverSsr?.isDehydrated() || sentIds.has(instance.id)) {
        return
      }

      if (atomsStream.isClosed()) {
        console.warn(
          `tried to stream atom ${instance.id} after stream was already closed`
        )
        return
      }

      // promise not yet resolved on the atom. Wait to stream it
      if (instance.promise) {
        await instance.promise
      }

      sentIds.add(instance.id)

      if (shouldDehydrateAtom && !shouldDehydrateAtom(instance)) {
        return
      }

      atomsStream.enqueue({
        dehydratedAt: Date.now(),
        state: { [instance.id]: instance.d() },
      })
    })
    // on the client
  } else {
    router.options.hydrate = async (dehydrated: DehydratedRouterAtomState) => {
      await originalHydrate?.(dehydrated)

      // hydrate the ecosystem with the dehydrated data (if it was dehydrated on the server)
      if (dehydrated.dehydratedEcosystem) {
        ecosystem.hydrate(dehydrated.dehydratedEcosystem.state)
      }

      // read the atom stream and hydrate the atoms as they come in
      const reader = dehydrated.atomsStream.getReader()
      reader
        .read()
        .then(async function handle({ done, value }) {
          ecosystem.hydrate(value?.state ?? {})

          if (done) {
            return
          }

          const result = await reader.read()
          return handle(result)
        })
        .catch(err => {
          console.error('Error reading atom stream:', err)
        })
    }
  }
}

type PushableStream = {
  stream: ReadableStream
  enqueue: (chunk: unknown) => void
  close: () => void
  isClosed: () => boolean
  error: (err: unknown) => void
}

function createPushableStream(): PushableStream {
  let controllerRef: ReadableStreamDefaultController
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
    },
  })
  let _isClosed = false

  return {
    stream,
    enqueue: chunk => controllerRef.enqueue(chunk),
    close: () => {
      controllerRef.close()
      _isClosed = true
    },
    isClosed: () => _isClosed,
    error: (err: unknown) => controllerRef.error(err),
  }
}
