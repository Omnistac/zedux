import { useEcosystem } from '@zedux/react'
import { type ReactElement, useEffect, useMemo } from 'react'

export interface HydrationBoundaryProps {
  children: React.ReactNode
  state: {
    dehydratedAt: number
    atoms: Record<string, any>
  }
}

/**
 * Render this at the top level of a TanStack React Router route. IMPORTANT:
 * This API will change. It requires a Zedux plugin that tracks update
 * timestamps to work properly. The `state.dehydratedAt` field will go away and
 * `state` itself will probably be renamed to `atoms`.
 *
 * NOTE: Choose either this or `attachEcosystem`. Don't use both.
 */
export const HydrationBoundary = ({
  children,
  state,
}: HydrationBoundaryProps) => {
  const ecosystem = useEcosystem()

  // This useMemo is for performance reasons only, everything inside it must
  // be safe to run in every render and code here should be read as "in render".
  //
  // This code needs to happen during the render phase, because after initial
  // SSR, hydration needs to happen _before_ children render. Also, if hydrating
  // during a transition, we want to hydrate as much as is safe in render so
  // we can prerender as much as possible.
  //
  // For any queries that already exist in the cache, we want to hold back on
  // hydrating until _after_ the render phase. The reason for this is that during
  // transitions, we don't want the existing queries and observers to update to
  // the new data on the current page, only _after_ the transition is committed.
  // If the transition is aborted, we will have hydrated any _new_ queries, but
  // we throw away the fresh data for any existing ones to avoid unexpectedly
  // updating the UI.
  const hydrationQueue: Record<string, any> | undefined = useMemo(() => {
    if (!state || typeof state !== 'object') {
      return
    }

    const newHydrations: Record<string, any> = {}
    const existingQueries: Record<string, any> = {}

    for (const [id, hydration] of Object.entries(state.atoms)) {
      const existingAtom = ecosystem.n.get(id)

      if (!existingAtom) {
        newHydrations[id] = hydration

        return
      }

      // TODO: Create an ecosystem plugin that tracks `stateUpdatedAt` for all
      // atoms and attaches that to dehydration data on the server and can be
      // checked here for client-side atoms.

      // const hydrationIsNewer =
      //   hydration.state.dataUpdatedAt > existingAtom.state.dataUpdatedAt ||
      //   (hydration.promise &&
      //     existingAtom.state.status !== 'pending' &&
      //     existingAtom.state.fetchStatus !== 'fetching' &&
      //     hydration.dehydratedAt !== undefined &&
      //     hydration.dehydratedAt > existingAtom.state.dataUpdatedAt);

      // if (hydrationIsNewer) {
      existingQueries.push(hydration)
      // }
    }

    if (newHydrations.length > 0) {
      // It's actually fine to call this every render if passing `{ retroactive: false }`
      ecosystem.hydrate(newHydrations)
    }

    if (existingQueries.length > 0) {
      return existingQueries
    }
  }, [ecosystem, state])

  useEffect(() => {
    if (hydrationQueue) {
      ecosystem.hydrate(hydrationQueue)
    }
  }, [ecosystem, hydrationQueue])

  return children as ReactElement
}
