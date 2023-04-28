---
title: 'Atoms: The Happy Medium'
image: /img/zedux-and-react.png
tags: [introductory]
---

The React state management world has seen extremes.

Flux gave us the bad extreme of module decoupling and the good extreme of unidirectional data flow.

Redux gave us the bad extremes of boilerplate and indirection and the good extreme of debugging experience.

RTK toned down Redux's boilerplate extreme and a little of its indirection.

MobX gave us the bad extreme of implicitness, but found some happy mediums in other aspects like boilerplate and

Zustand toned down RTK's boilerplate further at the cost of also toning down its debugging experience. Zustand's success came from finding a happy medium between no boilerplate (for example, React's `useState()` hook) and extreme boilerplate (old-school Redux).

If `UI State <-> Server State` is a spectrum, React Query gave us the extreme of Server State management.

RTK Query found a happy medium between UI State and Server State - though Redux still sits closer to the bad extreme of indirection.

## Good Mediums

Not all spectrums need happy mediums. On some spectrums, you _do_ want to land as close to an extreme as possible - `Slowness <-> Speed` and `Lightweight <-> Heavy` for example. However, a good library will likely need to sacrifice some size for speed. Or sacrifice some size _and_ speed in exchange for achieving some happy mediums on other spectrums.

Here's a non-comprehensive list spectrums that require finding a balance
