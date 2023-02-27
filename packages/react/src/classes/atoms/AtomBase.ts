import { Store } from '@zedux/core'
import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
} from '@zedux/react/types'
import { Ecosystem } from '../Ecosystem'
import { AtomInstance } from '../instances/AtomInstance'
export abstract class AtomBase<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise,
  InstanceType extends AtomInstance<
    State,
    Params,
    Exports,
    StoreType,
    PromiseType
  >
> {
  public readonly dehydrate?: AtomConfig<State>['dehydrate']
  public readonly flags?: string[]
  public readonly hydrate?: AtomConfig<State>['hydrate']
  public readonly manualHydration?: boolean
  public readonly ttl?: number

  constructor(
    public readonly key: string,
    public readonly _value: AtomValueOrFactory<
      State,
      Params,
      Exports,
      StoreType,
      PromiseType
    >,
    protected readonly _config?: AtomConfig<State>
  ) {
    this.dehydrate = _config?.dehydrate
    this.flags = _config?.flags
    this.hydrate = _config?.hydrate
    this.manualHydration = _config?.manualHydration
    this.ttl = _config?.ttl

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }

  public abstract _createInstance(
    ecosystem: Ecosystem,
    keyHash: string,
    params: Params
  ): InstanceType

  public abstract getKeyHash(ecosystem: Ecosystem, params?: Params): string
}
