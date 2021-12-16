import { AnyAtomInstance, useAtomSelector } from '@zedux/react'
import { useMemo } from 'react'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceFilter,
  getAtomInstanceKeyHashFilter,
} from '../../../atoms/stateHub'

const asObject = (instances: AnyAtomInstance[]) =>
  instances.reduce((obj, instance) => {
    obj[instance.keyHash] = true
    return obj
  }, {} as Record<string, true>)

export const useFilteredInstances = (instances: AnyAtomInstance[]) => {
  const atomFilter = useAtomSelector(getAtomFilter)
  const atomFlagsFilter = useAtomSelector(getAtomFlagsFilter)
  const atomInstanceFilter = useAtomSelector(getAtomInstanceFilter)
  const atomInstanceActiveStateFilter = useAtomSelector(
    getAtomInstanceActiveStateFilter
  )
  const atomInstanceKeyHashFilter = useAtomSelector(
    getAtomInstanceKeyHashFilter
  )

  return useMemo(() => {
    // if no filters are selected, everything passes
    if (
      !atomFilter?.length &&
      !atomFlagsFilter?.length &&
      !atomInstanceFilter?.length &&
      !atomInstanceKeyHashFilter?.length
    ) {
      if (!atomInstanceActiveStateFilter?.length) return asObject(instances)

      // if ActiveState is the only filter, handle it separately (it's the only
      // AND-ed filter, so handling it later would need to do this exact same
      // check to see whether any other filters exist. So just do it here since
      // we already checked the other filters)
      return asObject(
        instances.filter(instance =>
          atomInstanceActiveStateFilter.includes(instance._activeState)
        )
      )
    }

    return asObject(
      instances.filter(
        instance =>
          (atomFilter?.includes(instance.atom.key) ||
            atomFlagsFilter?.some(flag =>
              instance.atom.flags?.includes(flag)
            ) ||
            atomInstanceFilter?.includes(instance.keyHash) ||
            atomInstanceKeyHashFilter?.some(partialKeyHash =>
              instance.keyHash
                .toLowerCase()
                .includes(partialKeyHash.toLowerCase())
            )) &&
          (!atomInstanceActiveStateFilter?.length ||
            atomInstanceActiveStateFilter.includes(instance._activeState))
      )
    )
  }, [
    atomFilter,
    atomFlagsFilter,
    atomInstanceFilter,
    atomInstanceActiveStateFilter,
    atomInstanceKeyHashFilter,
    instances,
  ])
}
