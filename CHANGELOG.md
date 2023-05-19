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
