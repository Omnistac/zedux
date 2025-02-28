import { injectSelf } from './injectSelf'

/**
 * Returns a hydration previously passed to `ecosystem.hydrate` for this atom's
 * id.
 *
 * This value can be passed directly to `injectSignal` to initialize signal
 * state. It will be returned again on subsequent evaluations, though you
 * typically ignore it.
 *
 * The rule of thumb is to always hydrate at the source - top-level
 * atoms/signals. While you can hydrate mapped signals or derived atoms, that
 * will result in an extra evaluation. Though, since the second evaluation
 * happens immediately, before the new atom can be used, it's usually fine.
 *
 * Scoped atoms can't be hydrated. Hydrate the context instead.
 *
 * When an atom is destroyed and recreated, it will receive this same hydration
 * again. You can prevent this by listening to the `cycle` ecosystem event and
 * deleting `ecosystem.hydration[event.source.id]` when `source` becomes Active.
 *
 * If the atom configured a `hydrate` function, it will be called and the
 * resulting, transformed value returned. Pass `{ transform: false }` to prevent
 * this.
 *
 * When `injectHydration` is called in any atom, it prevents Zedux from trying
 * to auto-hydrate the atom after initial evaluation. Pass `{ intercept: false
 * }` to prevent this.
 */
export const injectHydration = <T = unknown>(config?: {
  intercept?: boolean
  transform?: boolean
}): T => {
  const self = injectSelf()
  self.H ||= config?.intercept !== false

  const hydration = self.e.hydration?.[self.id]

  return typeof hydration === 'undefined'
    ? hydration
    : config?.transform !== false && self.t.hydrate
    ? self.t.hydrate(hydration)
    : hydration
}
