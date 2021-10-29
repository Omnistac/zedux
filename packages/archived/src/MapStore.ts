import { HierarchyConfig, RecursivePartial, Settable, Store } from '@zedux/core'

export class MapStore<State = any> extends Store<State> {
  static readonly hierarchyConfig: HierarchyConfig<Map<string, any>> = {
    clone: map => new Map(map),
    create: () => new Map(),
    get: (map, key) => map.get(key),
    isNode: map => map instanceof Map,
    iterate: (map, callback) => map.forEach((val, key) => callback(key, val)),
    set: (map, key, val) => map.set(key, val),
    size: map => map.size,
  }

  public setStateDeep(settable: Settable<RecursivePartial<State>>, meta?: any) {
    let newState = settable

    if (typeof settable === 'function') {
      newState = (settable as (state: State) => RecursivePartial<State>)(
        this.getState()
      )
    }

    const convertObjToMapDeep = (map: Record<string, any>) => {
      if (!map || typeof map !== 'object') return map

      const newMap = new Map()

      Object.entries(map).forEach(([key, val]) => {
        newMap.set(key, convertObjToMapDeep(val))
      })

      return newMap
    }

    const asMap = convertObjToMapDeep(newState)

    return super.setStateDeep(
      (asMap as unknown) as RecursivePartial<State>,
      meta
    )
  }
}
