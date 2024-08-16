# JS Reactivity Benchmark

Benchmarks for Zedux's atomic model and comparisons to similar reactive tools adapted from [this repo](https://github.com/milomg/js-reactivity-benchmark).

```
$ pnpm bench
```

## Features

- Configurable dependency graph: graph shape, density, read rate are all adjustable.
- Easily add new benchmarks and frameworks
- Supports dynamic reactive nodes
- Framework agnostic. Simple API to test new reactive frameworks.
- Uses v8 intrinsics to warmup and cleanup
- Tracks garbage collection overhead per test
- Outputs a csv file for easy integration with other tools.

Current reactivity benchmarks ([S.js](https://github.com/adamhaile/S/blob/master/bench/bench.js), [CellX](https://github.com/Riim/cellx/blob/master/perf/perf.html)) are focused on creation time, and update time for a static graph. Additionally, existing benchmarks aren't very configurable, and don't test for dynamic dependencies. We've created a new benchmark that allows library authors to compare their frameworks against each other, and against the existing benchmarks, as well as against a new configurable benchmark with dynamically changing sources.

We're also working on enabling consistent logging and efficient tracking of GC time across all benchmarks.

The frameworks are all plenty fast for typical applications. The charts report the run time of the test in milliseconds on an M1 laptop, and are made using [Tableau](https://public.tableau.com/). Typical applications will do much more work than a framework benchmark, and at these speeds the frameworks are unlikely to bottleneck overall performance.

That said, there's learning here to improve performance of all the frameworks.

![Performance Results](https://user-images.githubusercontent.com/14153763/221107379-51a93eab-95ac-4c89-9a74-7a1527fc4a03.png)

![Raw](https://user-images.githubusercontent.com/14153763/222212050-5b651e4d-6e71-4667-94e7-eb94b7030bc1.png)
