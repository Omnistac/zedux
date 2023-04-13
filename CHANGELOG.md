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
