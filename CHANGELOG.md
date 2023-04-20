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
