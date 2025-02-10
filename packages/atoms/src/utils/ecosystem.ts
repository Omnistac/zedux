import { detailedTypeof, is } from '@zedux/core'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
} from '../types'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomTemplate } from '../classes/templates/AtomTemplate'
import type { Ecosystem } from '../classes/Ecosystem'
import { GraphNode } from '../classes/GraphNode'
import { getSelectorKey, SelectorInstance } from '../classes/SelectorInstance'
import { getEvaluationContext } from './evaluationContext'

const changeScopedNodeId = (
  ecosystem: Ecosystem,
  templateKey: string,
  newInstance: GraphNode,
  nonContextualizedId: string
) => {
  // if this is the first scoped node of its template to evaluate, record the
  // scope all future instances of the template will need to be provided
  ecosystem.s ??= {}
  ecosystem.s[templateKey] ??= [...newInstance.V!.keys()]

  // give the new scoped node a `@scope()`-suffixed id
  const contextValueStrings = [...newInstance.V!.values()].map(val => {
    const resolvedVal =
      val?.constructor?.name === WeakRef.name
        ? (val as WeakRef<any>).deref()
        : val

    return is(resolvedVal, AtomInstance)
      ? (resolvedVal as AtomInstance).id
      : ecosystem._idGenerator.hashParams(resolvedVal)
  })

  const scopedId = `${nonContextualizedId}-@scope(${contextValueStrings.join(
    ','
  )})`

  newInstance.id = scopedId
}

const getContextualizedId = (
  ecosystem: Ecosystem,
  scopeKeys: Record<string, any>[],
  id: string
) => {
  let allResolved = true

  const contextValueStrings = scopeKeys.map(context => {
    // this ultimately pulls from either a React/user-provided scope or from a
    // currently-evaluating observer's cached scope. Since scoped atoms
    // propagate their scope to all observers, this means you have to provide
    // every transitive context for all nodes up the source tree when getting
    // any node that uses other scoped nodes. We could remove that requirement
    // by merging cached scope with passed scope. That would only help when e.g.
    // setting a scoped atom inside a `ecosystem.withScope` call, not when
    // initializing nodes. I think that's a rare case, so not doing for now.
    const resolvedVal = ecosystem.S!(ecosystem, context)

    if (typeof resolvedVal === 'undefined') {
      allResolved = false
      return
    }

    return is(resolvedVal, AtomInstance)
      ? (resolvedVal as AtomInstance).id
      : ecosystem._idGenerator.hashParams(resolvedVal)
  })

  return allResolved && `${id}-@scope(${contextValueStrings.join(',')})`
}

export const getNode = <G extends AtomGenerics>(
  ecosystem: Ecosystem,
  template: AtomTemplateBase<G> | GraphNode<G> | AtomSelectorOrConfig<G>,
  params?: G['Params']
): GraphNode => {
  if ((template as GraphNode).izn) {
    // if the passed atom instance is Destroyed, get(/create) the
    // non-Destroyed instance
    return (template as GraphNode).l === 'Destroyed' &&
      (template as GraphNode).t
      ? ecosystem.getNode((template as GraphNode).t, (template as GraphNode).p)
      : template
  }

  if (DEV) {
    if (typeof params !== 'undefined' && !Array.isArray(params)) {
      throw new TypeError(
        `Zedux: Expected atom params to be an array. Received ${detailedTypeof(
          params
        )}`
      )
    }
  }

  if (is(template, AtomTemplateBase)) {
    const id = (template as AtomTemplate).getInstanceId(ecosystem, params)

    // try to find an existing instance
    const instance = ecosystem.n.get(id) as AtomInstance
    if (instance) return instance

    const templateScope = ecosystem.s?.[(template as AtomTemplate).key]

    if (templateScope && (ecosystem.S || getEvaluationContext().n?.V)) {
      // if no atom was found, but we're in a contextual scope (or able to
      // create one from a currently-evaluating contextual node), look for an
      // atom with a scoped id.
      const contextualizedId = ecosystem.S
        ? getContextualizedId(ecosystem, templateScope, id)
        : ecosystem.withScope(getEvaluationContext().n!.V!, () =>
            getContextualizedId(ecosystem, templateScope, id)
          )

      if (contextualizedId) {
        const instance = ecosystem.n.get(contextualizedId)

        if (instance) return instance
      }
    }

    // create a new instance
    const newInstance = resolveAtom(
      ecosystem,
      template as AtomTemplate
    )._createInstance(
      ecosystem,
      id,
      (params || []) as G['Params']
    ) as AnyAtomInstance

    newInstance.i() // TODO: remove. Run this in AtomInstance constructor

    // scoped atoms change their id after initial evaluation
    if (newInstance.V) {
      changeScopedNodeId(
        ecosystem,
        (template as AtomTemplateBase).key,
        newInstance,
        id
      )
    }

    ecosystem.n.set(newInstance.id, newInstance)

    return newInstance
  }

  if (
    typeof template === 'function' ||
    (template && (template as AtomSelectorConfig).selector)
  ) {
    const selectorOrConfig = template as AtomSelectorOrConfig<G>
    const id = ecosystem.hash(selectorOrConfig, params)
    let instance = ecosystem.n.get(id) as SelectorInstance<G>

    if (instance) return instance

    const selectorKey = getSelectorKey(ecosystem, selectorOrConfig)
    const templateScope = ecosystem.s?.[selectorKey]

    if (templateScope && (ecosystem.S || getEvaluationContext().n?.V)) {
      // if no selector was found, but we're in a contextual scope (or able to
      // create one from a currently-evaluating contextual node), look for a
      // selector with a scoped id.
      const contextualizedId = ecosystem.S
        ? getContextualizedId(ecosystem, templateScope, id)
        : ecosystem.withScope(getEvaluationContext().n!.V!, () =>
            getContextualizedId(ecosystem, templateScope, id)
          )

      if (contextualizedId) {
        const instance = ecosystem.n.get(contextualizedId)

        if (instance) return instance
      }
    }

    // create the instance; it doesn't exist yet
    instance = new SelectorInstance(
      ecosystem,
      id,
      selectorOrConfig,
      params || []
    )

    // scoped selectors change their id after initial evaluation
    if (instance.V) {
      changeScopedNodeId(ecosystem, selectorKey, instance, id)
    }

    ecosystem.n.set(instance.id, instance)

    return instance
  }

  throw new TypeError(
    `Zedux: Expected a template or node. Received ${detailedTypeof(template)}`
  )
}

const resolveAtom = <A extends AnyAtomTemplate>(
  { flags, overrides }: Ecosystem,
  template: A
) => {
  const override = overrides[template.key]
  const maybeOverriddenAtom = (override || template) as A

  // to turn off flag checking, just don't pass a `flags` prop
  if (flags) {
    const badFlag = maybeOverriddenAtom.flags?.find(
      flag => !flags.includes(flag)
    )

    if (DEV && badFlag) {
      console.error(
        `Zedux: encountered unsafe atom template "${template.key}" with flag "${badFlag}". This should be overridden in the current environment.`
      )
    }
  }

  return maybeOverriddenAtom
}

export const mapOverrides = (overrides: AnyAtomTemplate[]) =>
  overrides.reduce((map, atom) => {
    map[atom.key] = atom
    return map
  }, {} as Record<string, AnyAtomTemplate>)
