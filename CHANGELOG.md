## v2.0.0-rc.8 (Apr 30, 2025)

### Fixes:

- `atoms`: correct the return type of `Ecosystem#getOnce` (#247)
- `atoms`, `stores`: improve types for ions and promises in atoms and atom apis (#242)

## v2.0.0-rc.7 (Apr 3, 2025)

### New Features:

- `atoms`, `stores`: improve `injectPromise` and `injectStorePromise` type overloads (#238)

## v2.0.0-rc.6 (Apr 3, 2025)

### New Features:

- **Breaking Change** `atoms`: send ecosystem events immediately (#236)
- `atoms`: add memos to `ecosystem.n` for cache management (#235)
- `atoms`: consistently batch effect callbacks (#234)

## v2.0.0-rc.5 (Mar 30, 2025)

### New Features:

- **Breaking Change** `atoms`, `react`, `stores`: improve `injectPromise` - add `dataSignal`, `initialData`, `ZeduxPromise` (#222)
- `atoms`: lazily recalculate node weights (#231)

### Fixes:

- `react`: make static hooks always rerender on destroy (#232)

## v2.0.0-rc.4 (Mar 21, 2025)

### Fixes:

- `stores`: restore previous store scheduler instead of clearing (#229)

## v2.0.0-rc.3 (Mar 21, 2025)

### New Features:

- `react`: support react 18 component names (#227)

### Fixes:

- `core`, `stores`: make stores scheduler kick off the atoms scheduler first (#226)

## v2.0.0-rc.2 (Mar 18, 2025)

### Fixes:

- `react`: fix import path in `AtomProvider` (#224)

## v2.0.0-rc.1 (Mar 18, 2025)

### New Features:

- `atoms`: dedupe mapped signal events that reach multiple children (#221)
- `react`: add function overloads to `AtomProvider` props (#219)

### Fixes:

- `atoms`: unschedule effects from the right scheduler (#216)
- `react`: use scope in `useAtomContext` when using default params (#217)
- `core`, `machines`, `stores`: rename core package `Settable` to `StoreSettable` (#215)

## v2.0.0-rc.0 (Mar 14, 2025)

### New Features:

- **Breaking Change** `atoms`, `stores`: improve `findAll`, ions, and clean up types, properties, and deprecations (#212)
- **Breaking Change** `atoms`, `stores`: rename `getInstanceId` to `getNodeId` and add a `scope` option (#211)
- **Breaking Change** `machines`, `stores`: rename store-based APIs and types in the stores package (#213)

## v2.0.0-beta.8 (Mar 13, 2025)

### New Features:

- `atoms`: make wrapper functions reuse wrapped function names (#208)

### Fixes:

- `atoms`: fix and optimize quicksort calculations (#209)

## v2.0.0-beta.7 (Mar 11, 2025)

### Fixes:

- `react`: remove react package dep on core package (#206)

## v2.0.0-beta.6 (Mar 11, 2025)

### New Features:

- **Breaking Change** `atoms`: support `@atom` node type filter in `findAll` and `dehydrate` (#204)
- **Breaking Change** `atoms`, `stores`: use a singly-linked list for evaluation reasons (#202)
- **Breaking Change** `atoms`, `react`, `stores`: standardize id generation (#201)
- **Breaking Change** `atoms`, `core`, `immer`, `machines`, `react`, `stores`: separate sync and async schedulers (#200)

## v2.0.0-beta.5 (Feb 28, 2025)

### New Features:

- **Breaking Change** `atoms`: rename atom flags to tags (#188)
- **Breaking Change** `atoms`: use consistent terminology for observers and sources (#197)
- **Breaking Change** `atoms`, `stores`: implement `injectHydration`; remove `manualHydration` (#195)
- **Breaking Change** `atoms`, `react`: rework ecosystem resets and internal module state (#190)
- **Breaking Change** `atoms`, `immer`, `machines`, `react`, `stores`: de-underscore-prefix atom promise properties; move `_isEvaluating` to store atoms (#196)
- **Breaking Change** `atoms`, `core`, `immer`, `machines`, `react`: remove atoms package's dependency on core package (#191)
- `atoms`: wrap exports and `injectCallback` in current atom's scope (#187)
- `react`: check for `React.use` before using; partially support React 18 (#198)

### Fixes:

- `react`: only rerender in `useAtomInstance` if subscribed (#185)

## v2.0.0-beta.4 (Feb 14, 2025)

### Fixes:

- `atoms`, `stores`: fix some more v2 types (#180)

## v2.0.0-beta.3 (Feb 14, 2025)

### Fixes:

- **Breaking Change** `atoms`, `react`, `stores`: fix some types, return values, and relative imports (#178)

## v2.0.0-beta.2 (Feb 12, 2025)

### New Features:

- **Breaking Change** `atoms`: make `injectMemo` reactive when no deps are passed (#171)
- **Breaking Change** `atoms`, `react`: replace atom getters with ecosystem function properties (#169)
- **Breaking Change** `atoms`, `react`, `stores`: add `status` getter property to graph nodes (#173)
- **Breaking Change** `atoms`, `react`, `stores`: implement `untrack` and rework injectors (#170)
- **Breaking Change** `atoms`, `react`, `stores`: implement new plugins spec (#168)
- **Breaking Change** `atoms`, `immer`, `machines`, `react`, `stores`: make listeners passive, implement all implicit events (#158)
- `atoms`, `react`, `stores`: implement scoped atoms, `inject`, and `ecosystem.withScope` (#172)

### Fixes:

- `atoms`: add tests for proxies and fix several edge case bugs (#176)
- `atoms`, `core`: defer state changes during node evaluation (#175)

## v2.0.0-beta.1 (Jan 21, 2025)

### New Features:

- **Breaking Change** `atoms`: remove `createdAt` timestamp tracking (#150)
- **Breaking Change** `atoms`, `react`, `stores`: make `signal.get` reactive and add `signal.getOnce` (#151)

## v2.0.0-beta.0 (Jan 6, 2025)

### New Features:

- **Breaking Change** `atoms`, `core`, `machines`, `react`, `stores`: implement proxies, signals, and mapped signals (#147)

### Fixes:

- `immer`: import named `produce` export from immer (#146)
- `atoms`, `core`, `immer`, `machines`, `react`: remove package.json production exports (#137) (#142)

## v2.0.0-alpha.1 (Oct 13, 2024)

### Auxiliary Changes:

- `react`: relax React peer dep for now - use `>=18` (#125)

## v2.0.0-alpha.0 (Oct 11, 2024)

### New Features:

- **Breaking Change** `core`: remove hierarchy config (#94)
- **Breaking Change** `atoms`, `immer`, `machines`, `react`: implement ExternalNode class and make nodes the keys of edge maps (#120)
- **Breaking Change** `atoms`, `core`, `immer`, `machines`, `react`: make instances valid graph nodes and jobs (#114)

## v1.3.0-rc.2 (Jul 31, 2024)

### Fixes:

- `react`: only rerun `useAtomSelector` effect on cache id change (#110)

## v1.3.0-rc.1 (Jul 30, 2024)

### Fixes:

- `react`: restore `useAtomSelector` mounted state when swapping inline refs (#108)

## v1.3.0-rc.0 (Jul 30, 2024)

This version contains huge fixes for `useAtomSelector` that are only fully compatible with React 19 or with React 18 when not using StrictMode. It's recommended to wait for React 19 before upgrading to this version.

### Fixes:

- `atoms`, `react`: optimize `useAtomSelector` for React 19 (#106)

## v1.2.3 (Sep 7, 2024)

### Fixes:

- `react`: make `useAtomSelector` wait for idle time to do failsafe cleanup (#113)

## v1.2.2 (Jun 13, 2024)

### Fixes:

- `atoms`: disable `ecosystem.find()` fuzzy search if params are passed (#103)

## v1.2.2-rc.0 (May 30, 2024)

### Fixes:

- `atoms`, `react`: useAtomSelector - subscribe to the new selector before destroying the old (#101)

## v1.2.1 (May 14, 2024)

### Fixes:

- `core`: allow store-extending classes to have array state types (#96)
- `core`: always notify effects subscribers when a hydration has metadata (#98)

## v1.2.0 (Feb 6, 2024)

This is mostly a republish of the last v1.2.0 release candidate. Looks good :+1:

### Fixes:

- `react`: improve types for AtomProvider (#92)

## v1.2.0-rc.1 (Nov 20, 2023)

### Fixes:

- `react`: handle unstable inline selector results in `useAtomSelector` (#88)

## v1.2.0-rc.0 (Nov 14, 2023)

This release featured a near-full rewrite of the `useAtomInstance` and `useAtomSelector` hooks. They should be stable, but we're releasing a release candidate version first to verify

### New Features:

- `atoms`, `react`: remove uSES usages and support strict mode (#86)

## v1.1.1 (Sep 9, 2023)

### New Features:

- `atoms`: give atom instances access to their real template type (#81)
- `atoms`: make `ecosystem.find()` do a fuzzy search when no exact match (#79)

## v1.1.0 (Aug 1, 2023)

Republish of v1.1.0-rc.0 with no additional changes since the release candidate looks good

### New Features:

- `atoms`: add `runOnInvalidate` option to `injectPromise` (#69)
- `atoms`: deprecate `injectInvalidate` (prefer `injectSelf`) (#70)
- `core`: micro-optimize iterating and removing store subscribers (#76)

### Fixes:

- `atoms`: make query atoms retain data (#68)
- `core`: point core package's field to the correct file (#75)
- `react`: fix multiple renderers cross-window React warning (#72)
- `atoms`, `immer`, `machines`: prevent injectors from consuming hydrations (#71)

## v1.1.0-rc.0 (Jul 22, 2023)

### New Features:

- `atoms`: add `runOnInvalidate` option to `injectPromise` (#69)
- `atoms`: deprecate `injectInvalidate` (prefer `injectSelf`) (#70)
- `core`: micro-optimize iterating and removing store subscribers (#76)

### Fixes:

- `atoms`: make query atoms retain data (#68)
- `core`: point core package's field to the correct file (#75)
- `react`: fix multiple renderers cross-window React warning (#72)
- `atoms`, `immer`, `machines`: prevent injectors from consuming hydrations (#71)

## v1.0.3 (Jun 23, 2023)

### Fixes:

- `atoms`: let the WeakMap clean up selector ref keys (#66)
- `atoms`: make data retention consistent across `injectPromise` and `api(promise)` (#65)

## v1.0.2 (May 19, 2023)

Zedux got a big speed boost! In practice it won't matter much, but Zedux should now perform even better on stress tests and benchmarks. Enjoy!

### New Features:

- `atoms`: allow setting promise to undefined in AtomApi (#58)
- `atoms`: improve graph perf by removing unnecessary `Object.keys()` calls (#52)
- `atoms`: improve non-TS `.getInstance()` usage by throwing helpful errors (#59)
- `atoms`, `react`: make atoms package fully framework agnostic (#51)

### Fixes:

- `atoms`: improve atom searching (#57)
- `atoms`: make it easier for TS to infer AtomApi types from chained methods (#49)
- `react`: make React imports specify file extensions in esm builds (#53)
- `react`: update React peer dep to a minimum of v16.3.0 (#54)
- `atoms`, `react`: improve overloads of atom-template-accepting functions for paramless atoms (#50)
- `atoms`, `core`, `immer`, `machines`, `react`: fix package.json export order (#56)

## v1.0.1 (Apr 28, 2023)

### Fixes:

- `atoms`: improve id generation; prevent selector with args cache reuse edge case (#46)
- `react`: use `useSyncExternalStore` shim for now (#45)

## v1.0.0 (Apr 24, 2023)

Zedux's API is officially stable. We have several additions planned, but no breaking changes for any user-facing or documented APIs in the pipeline for the near future. It's go time!

### New Features:

- **Breaking Change** `atoms`: `defaultTtl` -> `atomDefaults.ttl` (#38)
- **Breaking Change** `atoms`: implement AtomApiGenerics type map and all its helpers (#40)
- **Breaking Change** `react`: AtomInstanceProvider -> AtomProvider (#32)
- **Breaking Change** `react`: make `instance.invalidate()` a normal method (#29)
- **Breaking Change** `react`: move auto-batching from `api()` to `injectCallback()` (#31)
- **Breaking Change** `react`: reuse names that can be shared between instances & selectors (#30)
- **Breaking Change** `react`: useAtomConsumer -> useAtomContext (#33)
- **Breaking Change** `atoms`, `immer`: don't export `createInjector` - replace with `injectSelf` (#35)
- **Breaking Change** `atoms`, `core`, `machines`: break out state machines into their own `@zedux/machines` package (#36)
- **Breaking Change** `atoms`, `core`, `immer`, `machines`, `react`: internalTypes -> zeduxTypes (#37)
- `atoms`, `react`: break the atomic model into its own @zedux/atoms package (#34)

## v1.0.0-rc.0 (Apr 24, 2023)

### New Features:

- **Breaking Change** `atoms`: `defaultTtl` -> `atomDefaults.ttl` (#38)
- **Breaking Change** `atoms`: implement AtomApiGenerics type map and all its helpers (#40)
- **Breaking Change** `react`: AtomInstanceProvider -> AtomProvider (#32)
- **Breaking Change** `react`: make `instance.invalidate()` a normal method (#29)
- **Breaking Change** `react`: move auto-batching from `api()` to `injectCallback()` (#31)
- **Breaking Change** `react`: reuse names that can be shared between instances & selectors (#30)
- **Breaking Change** `react`: useAtomConsumer -> useAtomContext (#33)
- **Breaking Change** `atoms`, `immer`: don't export `createInjector` - replace with `injectSelf` (#35)
- **Breaking Change** `atoms`, `core`, `machines`: break out state machines into their own `@zedux/machines` package (#36)
- **Breaking Change** `atoms`, `core`, `immer`, `machines`, `react`: internalTypes -> zeduxTypes (#37)
- `atoms`, `react`: break the atomic model into its own @zedux/atoms package (#34)

## v0.5.11 (Apr 20, 2023)

### New Features:

- `react`: export SelectorCache class (#14)
- `react`: make selectors trigger statusChanged mod events on init and destroy (#15)
- `react`: make timestamp generation easily overridable; fix statusChanged event order (#17)
- `react`: make useAtomConsumer log instead of throw an error when instance is Destroyed
- `react`: simplify inline selector detection (#22)
- `react`: wrap scheduler run in try...finally; add handling for destroyed instances (#21)

### Fixes:

- `react`: make DEV mode React component id generation work in SpiderMonkey (#20)
- `react`: prevent `controller.abort()` from isolating the `abort` fn (#27)
- `react`: remove dehydrated state generic from ssr atom config options for now (#16)
- `react`: restore Active status when an atom instance is revived (#13)
- `core`, `react`: improve `state.on` and `Observable` types (#12)

## v0.5.10 (Apr 13, 2023)

### Fixes:

- `react`: make all stores of all atoms in the evaluation stack use the ecosystem's scheduler (#10)

## v0.5.9 (Apr 13, 2023)

Republish v0.5.8 with build cache issue fixed

## v0.5.8 (Apr 13, 2023)

### Fixes:

- `react`: make useAtomSelector rerender components when the selector value becomes undefined (#8)

## v0.5.7 (Apr 12, 2023)

### New Features:

- `core`: expose `detailedTypeof` and `isPlainObject` from core package
- `core`: remove `addMeta` and `hasMeta`

### Fixes:

- `react`: fix `api()` Exports type default
- `react`: fix `api()` Promise type inference when returning result immediately
- `react`: make EvaluationStack restore store scheduler context in all cases
