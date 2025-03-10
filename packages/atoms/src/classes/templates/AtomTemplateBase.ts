import {
  AtomConfig,
  AtomValueOrFactory,
  AtomGenerics,
  AnyAtomGenerics,
} from '@zedux/atoms/types/index'
import { prefix } from '@zedux/atoms/utils/general'
import { Ecosystem } from '../Ecosystem'
import { Signal } from '../Signal'

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
    public readonly _value: AtomValueOrFactory<
      G & {
        Signal: Signal<{ State: G['State']; Events: G['Events'] }> | undefined
      }
    >,
    public readonly _config?: AtomConfig<G['State']>
  ) {
    Object.assign(this, _config)

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }

  public abstract _createInstance(
    ecosystem: Ecosystem,
    id: string,
    params: G['Params']
  ): G['Node']

  public getInstanceId(ecosystem: Ecosystem, params?: G['Params']) {
    const base = ecosystem.makeId('atom', this.key, '')

    if (!params?.length) return base

    return `${base}-${ecosystem.hash(params)}`
  }
}
