import {
  ActiveState,
  useAtomInstance,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import React, { useMemo } from 'react'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceFilter,
  getAtomInstanceKeyHashFilter,
  stateHub,
} from '../../atoms/stateHub'
import {
  ecosystemAtomFlags,
  ecosystemAtomInstances,
  ecosystemAtoms,
} from '../../atoms/ecosystemWrapper'
import { MultiSelect } from '../../styles'
import { GlobalFilter } from '../../types'

const AtomFilter = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const atoms = useAtomValue(ecosystemAtoms)

  const options = useMemo(() => {
    return atoms.reduce((obj, atom) => {
      obj[atom] = atom
      return obj
    }, {} as Record<string, string>)
  }, [atoms])

  const selected = useAtomSelector(getAtomFilter) || []

  return (
    <MultiSelect
      emptyText="No Atoms Found"
      onDeselect={id => {
        stateHubInstance.exports.setFilter(GlobalFilter.Atom, (state = []) =>
          state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setFilter(GlobalFilter.Atom, (state = []) => [
          ...state,
          id,
        ])
      }}
      options={options}
      placeholder="Filter By Atom"
      selected={selected}
    />
  )
}

const AtomFlagsFilter = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const atomFlags = useAtomValue(ecosystemAtomFlags)

  const options = useMemo(() => {
    return atomFlags.reduce((obj, flag) => {
      obj[flag] = flag
      return obj
    }, {} as Record<string, string>)
  }, [atomFlags])

  const selected = useAtomSelector(getAtomFlagsFilter) || []

  return (
    <MultiSelect
      emptyText="No Flags Found"
      onDeselect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomFlags,
          (state = []) => state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomFlags,
          (state = []) => [...state, id]
        )
      }}
      options={options}
      placeholder="Filter By Atom Flag"
      selected={selected}
    />
  )
}

const AtomInstanceFilter = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const atomInstances = useAtomValue(ecosystemAtomInstances)

  const options = useMemo(() => {
    return atomInstances.reduce((obj, instance) => {
      obj[instance.keyHash] = instance.keyHash
      return obj
    }, {} as Record<string, string>)
  }, [atomInstances])

  const selected = useAtomSelector(getAtomInstanceFilter) || []

  return (
    <MultiSelect
      emptyText="No Atom Instances Found"
      onDeselect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstance,
          (state = []) => state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstance,
          (state = []) => [...state, id]
        )
      }}
      options={options}
      placeholder="Filter By Atom Instance"
      selected={selected}
    />
  )
}

const AtomInstanceActiveStateFilter = () => {
  const stateHubInstance = useAtomInstance(stateHub)

  const selected = useAtomSelector(getAtomInstanceActiveStateFilter) || []

  return (
    <MultiSelect
      emptyText="No More States"
      onDeselect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstanceActiveState,
          (state = []) => state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstanceActiveState,
          (state = []) => [...state, id as ActiveState]
        )
      }}
      options={ActiveState}
      placeholder="Filter By Instance Active State"
      selected={selected}
    />
  )
}

const AtomInstanceKeyHashFilter = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const selected = useAtomSelector(getAtomInstanceKeyHashFilter) || []

  return (
    <MultiSelect
      mode="custom"
      onDeselect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstanceKeyHash,
          (state = []) => state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setFilter(
          GlobalFilter.AtomInstanceKeyHash,
          (state = []) => [...state, id]
        )
      }}
      placeholder="Filter By Key Match"
      selected={selected}
    />
  )
}

export const globalFilterMap = {
  [GlobalFilter.Atom]: AtomFilter,
  [GlobalFilter.AtomFlags]: AtomFlagsFilter,
  [GlobalFilter.AtomInstance]: AtomInstanceFilter,
  [GlobalFilter.AtomInstanceActiveState]: AtomInstanceActiveStateFilter,
  [GlobalFilter.AtomInstanceKeyHash]: AtomInstanceKeyHashFilter,
}
