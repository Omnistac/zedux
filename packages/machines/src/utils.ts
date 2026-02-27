/**
 * The EdgeFlags. These are used as bitwise flags.
 *
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-8. Lower score = higher prio. Examples:
 *
 * - 0 = eventAware-implicit-internal-dynamic (aka TopPrio)
 * - 3 = eventless-explicit-internal-dynamic
 * - 15 = eventless-explicit-external-static
 *
 * Event edges are (currently) never paired with other flags and are unique in
 * that they don't prevent node destruction.
 *
 * IMPORTANT: Keep these in-sync with the main package -
 * packages/atoms/src/utils/general.ts
 */
export const Eventless = 1
export const Static = 8
export const EventlessStatic = Eventless | Static
