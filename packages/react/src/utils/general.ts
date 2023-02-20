/**
 * Compare two arrays and see if any elements are different (===). Returns true
 * by default if either array is undefined
 */
export const haveDepsChanged = (
  prevDeps?: any[],
  nextDeps?: any[],
  matchUndefinedAndEmpty?: boolean
) => {
  if (!prevDeps || !nextDeps) {
    return matchUndefinedAndEmpty
      ? !prevDeps?.length && !nextDeps?.length
      : !prevDeps || !nextDeps
  }

  return (
    prevDeps.length !== nextDeps.length ||
    prevDeps.some((dep, i) => nextDeps[i] !== dep)
  )
}

/**
 * is() - Checks if a value is an instance of a class
 *
 * We can't use instanceof 'cause that breaks across realms - e.g. when an atom
 * instance is shared between a parent and child window, that instance's object
 * reference will be different in both windows (since each window creates its
 * own copy of Zedux).
 *
 * The classToCheck should have a static $$typeof property whose value is a
 * symbol created with Symbol.for() (sharing the symbol reference across realms)
 *
 * Important! Only one level of inheritance is supported currently - we never
 * use $$typeof on a child of a child of a class, but if we do need a $$typeof
 * on the Atom class and the BaseAtom class, for example, we'll need to add
 * logic here to support that
 *
 * @param val anything - the thing we're checking
 * @param classToCheck a class with a static $$typeof property
 * @returns boolean - whether val is an instanceof classToCheck
 */
export const is = (val: any, classToCheck: { $$typeof: symbol }) =>
  val?.constructor &&
  (val.constructor.$$typeof === classToCheck.$$typeof ||
    Object.getPrototypeOf(val.constructor)?.$$typeof === classToCheck.$$typeof)

export const prefix = '@@zedux'
