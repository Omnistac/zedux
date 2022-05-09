import { localAtom } from '@zedux/react/factories/localAtom'
import { AtomValueOrFactory, AtomConfig } from '@zedux/react/types'
import { Ecosystem } from '../Ecosystem'
import { Atom } from './Atom'

export class LocalAtom<
  State,
  Params extends [id?: string | undefined, ...rest: any[]],
  Exports extends Record<string, any>
> extends Atom<State, Params, Exports> {
  constructor(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ) {
    super(key, value, { ttl: 0, ...config })
  }

  public getKeyHash(ecosystem: Ecosystem, params?: Params) {
    // If a string is passed as the first param, it's the id of the local atom.
    // An existing hash can be recreated.
    if (params && typeof params[0] === 'string')
      return super.getKeyHash(ecosystem, params)

    // Otherwise, every time a local atom is got, we create a new hash.
    return super.getKeyHash(ecosystem, ([
      ecosystem._idGenerator.generateLocalId(),
      ...(params || []).slice(1),
    ] as unknown) as Params)
  }

  public override(newValue: AtomValueOrFactory<State, Params, Exports>) {
    return localAtom(this.key, newValue, {
      flags: this.flags,
      forwardPromises: this.forwardPromises,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }
}
