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
  inputSelectors.

  Returns a memoized function that calculates the values of the
  given inputSelectors and passes them to a memoized version of
  the calculator.
*/
export function createSelector(calculator, inputSelectors) {

  // If there are no input selectors, we assume the selector is
  // dependent on the whole state tree. Implicitly create an
  // identity function input selector that just grabs the state:
  if (!inputSelectors.length) inputSelectors = [ state => state ]

  const memoizedCalculator = memoize(calculator)

  return memoize((...args) => {
    const resolvedDependencies = Array(inputSelectors.length)

    for (let i = 0; i < inputSelectors.length; i++) {
      resolvedDependencies[i] = inputSelectors[i](...args)
    }

    return memoizedCalculator(...resolvedDependencies)
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
