/**
 * When using SSR, only `generateNodeId` should be allowed to run. It is okay
 * for `generateAtomSelectorId` to run, but auto-id'd selectors won't be
 * hydratable on the client (usually fine for inline selectors). Ecosystem ids
 * and ids for LocalAtoms must be set manually
 *
 * To prevent Zedux from auto-id'ing AtomSelectors, use a shared function
 * reference. When using AtomSelectorConfig objects, make sure the object
 * reference itself is shared. In both cases, the function must have a unique
 * name.
 *
 * ```ts
 * // examples that will be auto-id'd:
 * useAtomSelector(({ get }) => get(myAtom)) // inline function ref can't be shared and has no name
 * const mySelector = { // this object reference can be shared...
 *   selector: ({ get }) => get(myAtom) // ...but the function has a generic name
 * }
 *
 * // examples where ids will be generated predictably based on params:
 * const mySelector = ({ get }) => get(myAtom) // function has a name and ref can be shared
 * const mySelector = { // this ref can be shared...
 *   selector: function mySelector({ get }) { // ...and the function has a name
 *     return get(myAtom)
 *   }
 * }
 * const mySelector = { // this ref can be shared...
 *   name: 'mySelector', // ...and we set the `name` config option
 *   selector: ({ get }) => get(myAtom)
 * }
 * ```
 */
export class IdGenerator {
  public idCounter = 0

  public generateAtomSelectorId = (name = 'as') => this.generateId(name)
  public generateEcosystemId = () => this.generateId('es')
  public generateLocalId = () => this.generateId('lo')
  public generateNodeId = () => this.generateId('no')

  public generateReactComponentId() {
    const { stack } = new Error()

    if (!stack) return ''

    const lines = stack
      .split('\n')
      .slice(2)
      .map(line =>
        line
          .trim()
          .replace('at ', '')
          .replace(/ \(.*\)/, '')
      )

    const componentName = lines
      .find(line => {
        if (!/\w/.test(line[0])) return false

        const identifiers = line.split('.')
        const fn = identifiers[identifiers.length - 1]
        return fn[0].toUpperCase() === fn[0]
      })
      ?.split(' ')[0]

    return this.generateId(componentName || 'UnknownComponent')
  }

  private generateId = (prefix: string) =>
    `${prefix}-${++this.idCounter}${Math.random().toString(16).slice(2, 14)}`
}
