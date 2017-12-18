/**
  Checks whether each item in oldArgs is exactly equivalent to
  its corresponding item in newArgs and the lengths are the same.
*/
export function areArgsEqual(oldArgs, newArgs) {
  if (!oldArgs || oldArgs.length !== newArgs.length) {
    return false
  }

  return oldArgs.every(
    (arg, index) => arg === newArgs[index]
  )
}


/**
  Takes a calculator function and a list of the calculator's
  dependencies.

  Returns a memoized function that calculates the values of the
  given dependencies and passes them to a memoized version of
  the calculator.
*/
export function createSelector(calculator, dependencies) {
  let memoizedCalculator = memoize(calculator)

  return memoize((...args) => {
    let resolvedDependencies = Array(dependencies.length)

    for (let i = 0; i < dependencies.length; i++) {
      resolvedDependencies[i] = dependencies[i](...args)
    }

    return memoizedCalculator(...resolvedDependencies, ...args)
  })
}


/**
  Wraps the given function, ensuring it is only called
  if the passed arguments are not exactly (===) equivalent
  on subsequent invocations.
*/
export function memoize(func) {
  let memoizedArgs = null
  let memoizedVal

  return (...args) => {
    if (areArgsEqual(memoizedArgs, args)) {
      return memoizedVal
    }

    memoizedArgs = args

    return memoizedVal = func(...args)
  }
}
