import {
  type AnyRouteMatch,
  type AnyRouter,
  type ParsedLocation,
  replaceEqualDeep,
} from '@tanstack/react-router'
import type {
  useCanGoBack,
  useChildMatches,
  useLoaderData,
  useLoaderDeps,
  useLocation,
  useMatch,
  useMatchRoute,
  useMatches,
  useNavigate,
  useParams,
  useParentMatches,
  useRouteContext,
  useRouterState,
  useSearch,
} from '@tanstack/react-router'
import {
  api,
  atom,
  injectAtomInstance,
  injectAtomState,
  injectAtomValue,
  injectCallback,
  injectMemo,
  injectRef,
  injectSignal,
} from '@zedux/react'

// Core router state interface matching TanStack Router's RouterState
interface RouterStateSnapshot {
  status: 'pending' | 'idle'
  isLoading: boolean
  isTransitioning: boolean
  location: ParsedLocation
  resolvedLocation: ParsedLocation
  matches: AnyRouteMatch[]
  pendingMatches?: AnyRouteMatch[]
  cachedMatches: AnyRouteMatch[]
  statusCode: number
  redirect?: any // Simplified to avoid complex redirect types
  lastUpdated: number
  loadedAt?: number // Added missing property
}

export const routeAtom = atom(
  '@zedux/tanstack-react-router/route',
  () => {
    // Router reference that will be populated by RouteBridge
    const routerRef = injectRef<AnyRouter | null>(null)

    // Navigation callback ref that will be populated by RouteBridge
    const navigateRef = injectRef<any | null>(null)

    // History callback refs
    const historyRef = injectRef<{
      back: () => void
      forward: () => void
      go: (n: number) => void
      push: (href: string) => void
      replace: (href: string) => void
    } | null>(null)

    // State signal
    const signal = injectSignal<RouterStateSnapshot | null>(null)

    // Function to update router state from RouteBridge
    const updateRouterState = injectCallback(
      (routerState: Partial<RouterStateSnapshot>) => {
        signal.set(
          state =>
            ({ ...state, ...routerState, lastUpdated: Date.now() } as any)
        )
      }
    )

    return api(signal).setExports({
      routerRef,
      navigateRef,
      historyRef,
      updateRouterState,
    })
  },
  {
    tags: ['unserializable'],
  }
)

// Type-safe injector hook equivalents

/**
 * Injector equivalent of useRouter hook
 */
export function injectRouter() {
  const { exports } = injectAtomInstance(routeAtom)
  return exports.routerRef.current
}

/**
 * Injector equivalent of useRouterState hook
 */
export const injectRouterState: typeof useRouterState = opts => {
  const [state, { routerRef }] = injectAtomState(routeAtom)
  const previousResult = injectRef<any>(undefined)

  return injectMemo(() => {
    if (!state) return undefined

    if (opts?.select) {
      if (
        opts.structuralSharing ??
        routerRef.current?.options.defaultStructuralSharing
      ) {
        const newSlice = replaceEqualDeep(
          previousResult.current,
          opts.select(state as any)
        )
        previousResult.current = newSlice
        return newSlice
      }
      return opts.select(state as any)
    }
    return state as any
  }, [state, opts])
}

/**
 * Injector equivalent of useNavigate hook
 */
export const injectNavigate: typeof useNavigate = () => {
  const { exports } = injectAtomInstance(routeAtom)

  if (!exports.navigateRef.current) {
    throw new Error(
      'Navigate function not available. Make sure RouteBridge is rendered.'
    )
  }

  return exports.navigateRef.current
}

/**
 * Injector equivalent of useLocation hook
 */
export const injectLocation: typeof useLocation = () => {
  const state = injectAtomValue(routeAtom)

  return state?.location as any
}

/**
 * Injector equivalent of useMatches hook
 */
export const injectMatches: typeof useMatches = () => {
  const state = injectAtomValue(routeAtom)

  return state?.matches || ([] as any)
}

/**
 * Injector equivalent of useMatch hook
 */
export const injectMatch: typeof useMatch = opts => {
  const matches = injectMatches()
  const prevMatch = injectRef<any>(undefined)

  return injectMemo(() => {
    const match = opts.from
      ? matches.find((m: any) => m.routeId === opts.from)
      : matches[matches.length - 1]

    if (!match) return prevMatch.current

    prevMatch.current = match

    return opts.select ? opts.select(match as any) : (match as any)
  }, [matches, opts])
}

/**
 * Injector equivalent of useChildMatches hook
 */
export const injectChildMatches: typeof useChildMatches = opts => {
  const match = injectMatch(opts ?? ({} as any))

  return injectMatches({
    select: (matches: any[]) => {
      const slicedMatches = matches.slice(
        matches.findIndex(d => d.id === match?.id) + 1
      )
      return opts?.select ? opts.select(slicedMatches) : slicedMatches
    },
    structuralSharing: opts?.structuralSharing,
  } as any)
}

/**
 * Injector equivalent of useParentMatches hook
 */
export const injectParentMatches: typeof useParentMatches = opts => {
  const match = injectMatch(opts ?? ({} as any))

  return injectMatches({
    select: (matches: any[]) => {
      const slicedMatches = matches.slice(
        0,
        matches.findIndex(d => d.id === match?.id)
      )
      return opts?.select ? opts.select(slicedMatches) : slicedMatches
    },
    structuralSharing: opts?.structuralSharing,
  } as any)
}

/**
 * Injector equivalent of useParams hook
 */
export const injectParams: typeof useParams = opts => {
  return injectMatch({
    from: opts.from as any,
    ...(opts.shouldThrow !== undefined && { shouldThrow: opts.shouldThrow }),
    ...(opts.structuralSharing !== undefined && {
      structuralSharing: opts.structuralSharing,
    }),
    ...(opts.strict !== undefined && { strict: opts.strict }),
    select: match => {
      const params = opts.strict === false ? match.params : match._strictParams

      return opts.select ? opts.select(params) : params
    },
  }) as any
}

/**
 * Injector equivalent of useSearch hook
 */
export const injectSearch: typeof useSearch = opts => {
  return injectMatch({
    from: opts.from as any,
    ...(opts.strict !== undefined && { strict: opts.strict }),
    ...(opts.shouldThrow !== undefined && { shouldThrow: opts.shouldThrow }),
    ...(opts.structuralSharing !== undefined && {
      structuralSharing: opts.structuralSharing,
    }),
    select: (match: any) => {
      return opts.select ? opts.select(match.search) : match.search
    },
  }) as any
}

/**
 * Injector equivalent of useCanGoBack hook
 */
export const injectCanGoBack: typeof useCanGoBack = () => {
  const router = injectRouter()

  return injectMemo(() => {
    return router?.history.canGoBack?.() ?? false
  }, [router])
}

/**
 * Injector equivalent of useMatchRoute hook
 */
export const injectMatchRoute: typeof useMatchRoute = () => {
  const router = injectRouter()

  return opts => {
    const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts
    return router?.matchRoute(rest as any, {
      pending,
      caseSensitive,
      fuzzy,
      includeSearch,
    })
  }
}

/**
 * Injector equivalent of useLoaderData hook
 */
export const injectLoaderData: typeof useLoaderData = opts => {
  return injectMatch({
    from: opts.from,
    strict: opts.strict,
    structuralSharing: opts.structuralSharing,
    select: (s: any) => {
      return opts.select ? opts.select(s.loaderData) : s.loaderData
    },
  } as any) as any
}

/**
 * Injector equivalent of useLoaderDeps hook
 */
export const injectLoaderDeps: typeof useLoaderDeps = opts => {
  const { select, ...rest } = opts

  return injectMatch({
    ...rest,
    select: s => {
      return select ? select(s.loaderDeps) : s.loaderDeps
    },
  }) as any
}

/**
 * Injector equivalent of useRouteContext hook
 */
export const injectRouteContext: typeof useRouteContext = opts => {
  return injectMatch({
    ...(opts as any),
    select: match => (opts.select ? opts.select(match.context) : match.context),
  }) as any
}
