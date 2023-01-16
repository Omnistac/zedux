import { readInstance } from '../classes/EvaluationStack'

/**
 * Retrieves the hydrated value of the current atom instance from the last call
 * to `ecosystem.hydrate()` that contained a value for this atom instance's
 * keyHash.
 *
 * Calls the `hydrate` atom config option on this atom (if any) to transform the
 * hydration before returning it.
 *
 * Accepts a defaultState param which is returned as-is if this atom's state has
 * not been hydrated.
 *
 * ```ts
 * ecosystem.hydrate({ myKey: 'my val' })
 *
 * const myAtom = atom('myKey', () => {
 *   const store = injectStore(injectHydration('fallback val'))
 * }, {
 *   // contrived example encoding and decoding the string
 *   dehydrate: val => encode(val)
 *   hydrate: rawVal => decode(rawVal)
 * })
 * ```
 *
 * You do not need to use this to hydrate all atoms. By default, all atoms will
 * have their store's state set to their hydrated state immediately after being
 * initialized (after the state factory runs for the first time).
 *
 * In some cases, this can lead to unwanted evaluations or hydration overwriting
 * a more-recent value. Use this injector to retrieve the hydrated value and
 * manipulate it yourself.
 *
 * Use the `manualHydration` atom config option to prevent Zedux from hydrating
 * this atom instance after initialization.
 *
 * ```ts
 * const exampleAtom = atom('example', () => {
 *   const hydration = injectHydration()
 *   const externalVal = injectAtomValue(otherAtom)
 *   const store = injectStore({ ...hydration, ...externalVal })
 *
 *   return store // Zedux won't hydrate this store's state after init now
 * }, {
 *   manualHydration: true // prevent automatic hydration
 * })
 * ```
 */
export const injectHydration: {
  <State = any>(defaultState: State): State
  <State = any>(): State
} = <State = any>(defaultState?: State) => {
  const instance = readInstance()
  const hydratedValue = instance.ecosystem.hydration?.[instance.keyHash]

  if (typeof hydratedValue === 'undefined') return defaultState

  if (instance.atom.consumeHydrations ?? instance.ecosystem.consumeHydrations) {
    delete instance.ecosystem.hydration?.[instance.keyHash]
  }

  return instance.atom.hydrate
    ? instance.atom.hydrate(hydratedValue)
    : hydratedValue
}
