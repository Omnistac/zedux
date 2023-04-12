## v0.5.7 (Apr 12, 2023)

### New Features:

- `core`: expose `detailedTypeof` and `isPlainObject` from core package
- `core`: remove `addMeta` and `hasMeta`

### Fixes:

- `react`: fix `api()` Exports type default
- `react`: fix `api()` Promise type inference when returning result immediately
- `react`: make EvaluationStack restore store scheduler context in all cases
