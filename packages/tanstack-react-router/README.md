# `@zedux/tanstack-react-router`

> [!WARNING]
> This is a WIP. All APIs are subject to change. Expect breaking changes between all versions.

A comprehensive suite of SSR and router state management tools that integrate TanStack React Router and TanStack React Start into Zedux.

When using TanStack React Start, TanStack Router owns your route state. While TSR is great, it's clumsy to use in tandem with a powerful state management tool like Zedux.

This package bridges the gap, providing SSR tools and Zedux atoms and injectors that make it easy to reactively use your TSR route state in Zedux.

## SSR

This package provides two distinct APIs for bootstrapping data from the server into Zedux atoms on the client:

- `attachEcosystem`
- `<HydrationBoundary>`

### `attachEcosystem`

This is the recommended way to set up SSR.

Call this in your TanStack Router [`router.tsx` `getRouter` function](https://tanstack.com/start/latest/docs/framework/react/guide/routing#the-router). It ties your [Zedux ecosystem](https://zedux.dev/docs/walkthrough/ecosystems) into every TSR router instance on both the server and the client.

This will automatically dehydrate _all_ atoms that are instantiated on the server and rehydrate them on the client.

```ts
// router.tsx
import { createRouter } from '@tanstack/react-router';
import { createEcosystem } from '@zedux/react';
import { attachEcosystem } from '@zedux/tanstack-react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const ecosystem = createInsightEcosystem({
    ssr: typeof window === 'undefined',
    environment: 'production',
  });

  const router = createRouter({
    context: { ecosystem },
    routeTree,
    scrollRestoration: true,
  });

  attachEcosystem({
    ecosystem,
    router,
  });

  return router;
}
```

Pass a `shouldDehydrateAtom` function to control which atoms are dehydrated. E.g. to ignore certain tags:

```tsx
attachEcosystem({
  ecosystem,
  router,
  shouldDehydrateAtom: instance => !instance.template.tags?.includes('no-ssr')
})
```

Currently, the tag `"unserializable"` is always automatically ignored with no way to configure that. We'll probably change this.

> [!NOTE]
> Presumably `attachEcosystem` already supports lazily streaming atom updates too. But this is completely untested.

### `<HydrationBoundary>`

A more manual approach to SSR. Render this at the top level of any route (or I believe this is possible in your `__root` route. I haven't tested this) to hydrate atoms you've dehydrated.

```tsx
export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    await doStuffUsingAtoms()

    const dehydratedAtoms = context.ecosystem.dehydrate({
      excludeTags: ['no-ssr']
    })

    return {
      dehydratedAt: Date.now(), // NOTE: temporary. This is going away
      atoms: dehydratedAtoms
    }
  }
})

function Home() {
  const state = Route.useLoaderData();

  return (
    <HydrationBoundary state={state}>
      <OtherStuff />
    </HydrationBoundary>
  )
}
```

> [!WARNING]
> When using `<HydrationBoundary>`, you'll need to manually call `syncRouteAtom` to use route-related injectors and the `routeAtom`. See [below](#note-on-auto-sync).

## Route State

Atom dehydration/hydration is nice and all. But it's only part of the TanStack Start picture. This package also exports utilities for working with TSR's route state in atoms.

### `routeAtom`

This atom syncs with TSR's state. You can use it directly to access route state or use any of the other injectors which all pull from this atom.

The `routeAtom` is a singleton, meaning it will only ever have one atom instance. That instance's state will have the following shape:

```ts
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
```

### Injectors

This package also exports the following injectors, all equivalents of TSR's own hooks:

- `injectCanGoBack`
- `injectChildMatches`
- `injectLoaderData`
- `injectLoaderDeps`
- `injectLocation`
- `injectMatch`
- `injectMatches`
- `injectMatchRoute`
- `injectNavigate`
- `injectParams`
- `injectParentMatches`
- `injectRouteContext`
- `injectRouter`
- `injectRouterState`
- `injectSearch`

See the documentation of the relevant hook in the [TanStack Router docs](https://tanstack.com/router/latest/docs/framework/react/api/router). There are some subtle differences in APIs, which I'm not documenting here right now because we may change all of this. Rely on TS to learn differences for now - everything is fully typed.

> [!WARNING]
> Several of these injectors are completely untested. And we may change approaches entirely. We currently avoid creating scoped atoms in these injectors, but that would be the most correct approach - inheriting route context from the React component tree.

### Note on Auto Sync

Zedux automatically keeps the `routeAtom` instance in sync with TSR's state when using [`attachEcosystem`](#attachecosystem). If not using `attachEcosystem`, you'll need to call `syncRouteAtom` manually in `route.tsx`'s `getRouter`:

```ts
import { createRouter } from '@tanstack/react-router';
import { createEcosystem } from '@zedux/react';
import { syncRouteAtom } from '@zedux/tanstack-react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const ecosystem = createInsightEcosystem({
    ssr: typeof window === 'undefined',
    environment: 'production',
  });

  const router = createRouter({
    context: { ecosystem },
    routeTree,
    scrollRestoration: true,
  });

  syncRouteAtom({
    ecosystem,
    router,
  });

  return router;
}
```

## Other Tips

For TS users: To use the Zedux ecosystem as router context, type your `__root` route like this:

```ts
export const Route = createRootRouteWithContext<{ ecosystem: Ecosystem }>()({
  ...
})
```

And be sure to actually add it in `router.tsx`

```ts
const router = createTanStackRouter({
  context: { ecosystem },
  routeTree,
  scrollRestoration: true,
});
```
