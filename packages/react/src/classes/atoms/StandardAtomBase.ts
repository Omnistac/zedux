import { Store } from '@zedux/core'
import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
} from '@zedux/react/types'
import { AtomInstance } from '../instances/AtomInstance'
import { AtomBase } from './AtomBase'

export abstract class StandardAtomBase<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> extends AtomBase<
  State,
  Params,
  AtomInstance<State, Params, Exports, StoreType, PromiseType>
> {
  public readonly consumeHydrations?: boolean
  public readonly dehydrate?: AtomConfig<State>['dehydrate']
  public readonly flags?: string[]
  public readonly hydrate?: AtomConfig<State>['hydrate']
  public readonly manualHydration?: boolean
  public readonly maxInstances?: number
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
    config?: AtomConfig<State>
  ) {
    super()
    this.consumeHydrations = config?.consumeHydrations
    this.dehydrate = config?.dehydrate
    this.flags = config?.flags
    this.hydrate = config?.hydrate
    this.manualHydration = config?.manualHydration
    this.maxInstances = config?.maxInstances
    this.ttl = config?.ttl

    // const map = new WeakMap();
    // map.set(newAtomInstance, true);
    // map.set({ control: true }, true);
    // console.log({ key: atom.key, map });
  }
}
