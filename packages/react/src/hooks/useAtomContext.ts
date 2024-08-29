import {
  AnyAtomGenerics,
  AnyAtomTemplate,
  AtomInstance,
  AtomInstanceType,
  AtomParamsType,
  AtomTemplateBase,
} from '@zedux/atoms'
import { is } from '@zedux/core'
import { useContext } from 'react'
import { useEcosystem } from './useEcosystem'
import { getReactContext } from '../utils'

/**
 * A React hook that accepts an atom template and returns an atom instance of
 * that template that has been provided over React context via `<AtomProvider>`
 * in a parent component.
 *
 * By default, returns undefined if no atom instance was provided.
 *
 * Pass an array of atom params (or an empty array if the atom doesn't take
 * params) as the second argument to make Zedux find or create the atom instance
 * matching the passed params if no atom instance was provided.
 *
 * Pass `true` as the second argument to make Zedux throw an error if no atom
 * instance was provided. This is the recommended overload in almost all
 * situations.
 *
 * If the provided atom instance is Destroyed, this hook logs an error but
 * returns the Destroyed instance as-is. Most other Zedux APIs are able to
 * recover from being passed a Destroyed instance by finding and using a new,
 * non-Destroyed version of the instance. You should still fix the problem as it
 * represents a memory leak.
 *
 * It can be fixed by simply using `useAtomInstance()` to get the atom instance
 * in the providing component.
 */
export const useAtomContext: {
  <A extends AnyAtomTemplate>(template: A): AtomInstanceType<A> | undefined

  <A extends AnyAtomTemplate>(
    template: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>

  <A extends AnyAtomTemplate>(
    template: A,
    throwIfNotProvided: boolean
  ): AtomInstanceType<A>
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  template: AtomTemplateBase<G>,
  defaultParams?: G['Params'] | boolean
) => {
  const ecosystem = useEcosystem()
  const instance: G['Node'] | undefined = useContext(
    getReactContext(ecosystem, template)
  )

  if (!defaultParams || is(instance, AtomInstance)) {
    if (DEV && instance?.l === 'Destroyed') {
      console.error(
        `Zedux: useAtomContext - A destroyed atom instance was provided with key "${instance.id}". This is not recommended. Provide an active atom instance instead e.g. by calling \`useAtomInstance()\` in the providing component.`
      )
    }

    return instance
  }

  if (defaultParams === true) {
    if (DEV) {
      throw new ReferenceError(
        `Zedux: useAtomContext - No atom instance was provided for atom "${template.key}".`
      )
    }

    // TODO: this should probably still throw an error. Change this when we have
    // a decent system for minified prod errors
    return instance
  }

  return ecosystem.getInstance(template, defaultParams)
}
