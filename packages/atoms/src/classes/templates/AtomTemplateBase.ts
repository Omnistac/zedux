import {
  AtomConfig,
  AtomValueOrFactory,
  AtomGenerics,
  AnyAtomGenerics,
  Scope,
} from '@zedux/atoms/types/index'
import { prefix } from '@zedux/atoms/utils/general'
import { Ecosystem } from '../Ecosystem'
import { AnySignal } from '@zedux/atoms/types/index'
import { getScopeString } from '@zedux/atoms/utils/graph'

export abstract class AtomTemplateBase<
  G extends AtomGenerics & { Node: any } = AnyAtomGenerics<{
    Node: any
  }>
> {
  public static $$typeof = Symbol.for(`${prefix}/AtomTemplateBase`)

  public readonly dehydrate?: AtomConfig<G['State']>['dehydrate']
  public readonly tags?: string[]
  public readonly hydrate?: AtomConfig<G['State']>['hydrate']
  public readonly ttl?: number

  /**
   * Set this to true when this atom template is a known override of another
   * atom template with the same key.
   *
   * This has no built-in functionality, but it allows plugins to identify
   * potentially problematic duplicate atom keys e.g. by hooking into the
   * `instanceReused` mod and logging a warning if the templates don't match and
   * neither is an override.
   */
  public _isOverride?: boolean

  constructor(
    public readonly key: string,

    /**
     * `v`alueOrFactory - the initial value of all instances of this atom or a
     * state factory that will be used to define the atom's params and create
     * the initial state and setup injectors, exports, a promise, and/or ttl for
     * the atom instance.
     */
    public readonly v: AtomValueOrFactory<
      G & {
        Signal: AnySignal<{ State: G['State']; Events: G['Events'] }> | undefined
      }
    >,

    /**
     * `c`onfig - a reference to the exact config object passed to this atom.
     * Stored as-is so we can pass it along to atom overrides
     */
    public readonly c?: AtomConfig<G['State']>
  ) {
    Object.assign(this, c)

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }

  /**
   * IMPORTANT: You should never call this manually. Zedux calls it internally
   * to create a new atom instance when an atom template + params combo is used
   * for the first time.
   *
   * Creates and returns a new AtomInstance class instance.
   *
   * This method should be overridden when creating custom AtomTemplate classes
   * that instantiate a custom AtomInstance class. Return a new instance of your
   * AtomInstance class. Use the passed ecosystem's `.makeId` and `.hash`
   * methods to construct id strings for the passed id and params.
   */
  public abstract _instantiate(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): G['Node']

  public getNodeId(
    ecosystem: Ecosystem,
    params?: G['Params'],
    { scope }: { scope?: Scope } = {}
  ) {
    const base = ecosystem.makeId('atom', this.key, '')

    // optimize the most common scenario
    if (!params?.length && !scope) return base

    const idParts = [base]

    if (params?.length) idParts.push(ecosystem.hash(params))
    if (scope) idParts.push(getScopeString(ecosystem, scope))

    return idParts.join('-')
  }
}
