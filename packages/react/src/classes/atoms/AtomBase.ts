import {
  AtomConfig,
  AtomValueOrFactory,
  AtomGenerics,
} from '@zedux/react/types'
import { Ecosystem } from '../Ecosystem'
import { AtomInstance } from '../instances/AtomInstance'
export abstract class AtomBase<
  G extends AtomGenerics,
  InstanceType extends AtomInstance<G>
> {
  public readonly dehydrate?: AtomConfig<G['State']>['dehydrate']
  public readonly flags?: string[]
  public readonly hydrate?: AtomConfig<G['State']>['hydrate']
  public readonly manualHydration?: boolean
  public readonly ttl?: number

  constructor(
    public readonly key: string,
    public readonly _value: AtomValueOrFactory<G>,
    protected readonly _config?: AtomConfig<G['State']>
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
    id: string,
    params: G['Params']
  ): InstanceType

  public abstract getInstanceId(
    ecosystem: Ecosystem,
    params?: G['Params']
  ): string
}
