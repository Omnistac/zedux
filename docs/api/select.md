# `select()`

A standard tool for computing and memoizing state derivations. Based on the excellent [reselect library](https://github.com/reactjs/reselect).

`select()` is a factory for creating [selectors](/docs/types/Selector.md). Selectors created by `select()` have two unique capabilities in that they:

1. Can be composed of other selectors.

2. Are memoized. This means that they will only recompute their value if their input changes. Useful for heavy calculations.

## Definition

```typescript
<S, D>(
  ...inputSelectors: Selector<S>[],
  calculator: (...args: any[]) => D
) => Selector<S>
```

No, that isn't valid typescript. But:

**inputSelectors** - The list of [selectors](/docs/types/Selector.md) whose output will be fed as input to the calculator function.

**calculator** - A function that takes the output of its selector dependencies as arguments and returns a state derivation.

## Memoization specifics

Memoization is usually something that just works and you don't need to know the specifics. But I'll assume that if you're reading this, you either do need to know, or you're curious to learn &ndash; and who am I to stop you?

All selectors perform an initial calculation the first time they're called. But memoized selectors will remember that first value. On subsequent invocations, memoized selectors only recalculate their values when their input changes. There are actually 2 pieces to this:

1. The piece that calls all the input selectors passing them the state object (and any other args) and compares their output to the previous output.

2. The piece that calls the calculator function, passing it the output of the input selectors.

A memoized selector will try to short-circuit as early as possible in this process:

If the selector is passed the same arguments, it'll skip steps 1 and 2.

If the selector is passed different arguments, it'll run step 1 and check if the output of the input selectors is all the same. If so, it'll skip step 2.

Step 2 will only be reached in the case of an input argument being different and an input selector returning a different value. This ensures that the potentially heavy calculator function will only be called when absolutely necessary.

Since all selectors take the store's state as their first (and only required) argument:

```javascript
selectIncompleteTodos(store.getState())
```

memoized selectors will only reach step 1 when the store's state changes and step 2 if a particular piece of state on which they depend changes.

## Notes

There are cases where the selector's arguments need to change frequently. For example:

```javascript
const oneStarMovies = selectByRating(state, 1)
const fiveStarMovies = selectByRating(state, 5)
```

Since we called the `selectByRating` selector with different arguments, we just killed our memoization. In many situations this is fine. But sometimes we need a workaround.

The solution is to create "selector factories" whose job is to return unique instances of the selector. This way we can have multiple parallel selector caches.

```javascript
const createByRatingSelector = rating => state =>
  state.entities.movies.filter(movie => movie.rating === rating)
```

Now instead of passing the argument to the selector on every invocation, we pass it once &ndash; when we create the selector:

```javascript
const selectOneStarMovies = createByRatingSelector(1)
const selectFiveStarMovies = createByRatingSelector(5)

// Now these guys take no additional arguments:
const oneStarMovies = selectOneStarMovies(state)
const fiveStarMovies = selectFiveStarMovies(state)
```
