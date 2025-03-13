import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  Job,
} from '../types'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomTemplate } from '../classes/templates/AtomTemplate'
import type { Ecosystem } from '../classes/Ecosystem'
import { ZeduxNode } from '../classes/ZeduxNode'
import { SelectorInstance } from '../classes/SelectorInstance'
import { getEvaluationContext } from './evaluationContext'
import { DESTROYED, is } from './general'
import { getInstanceId, getSelectorKey } from './selectors'

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
      : ecosystem.hash(resolvedVal, true)
  })

  return allResolved && `${id}-@scope(${contextValueStrings.join(',')})`
}

const resolveAtom = <A extends AnyAtomTemplate>(
  { tags, overrides }: Ecosystem,
  template: A
) => {
  const override = overrides[template.key]
  const maybeOverriddenAtom = (override || template) as A

  // to turn off tag checking, just don't pass a `tags` prop
  if (tags) {
    const badTag = maybeOverriddenAtom.tags?.find(tag => !tags.includes(tag))

    if (DEV && badTag) {
      console.error(
        `Zedux: encountered unsafe atom template "${template.key}" with tag "${badTag}". This should be overridden in the current environment.`
      )
    }
  }

  return maybeOverriddenAtom
}

export const mapRefToId = (ecosystem: Ecosystem, obj: any, name: string) => {
  let id = ecosystem.b.get(obj)
  if (id) return id

  id = ecosystem.makeId('ref', name || 'unknown')
  ecosystem.b.set(obj, id)

  return id
}

/**
 * The node gateway. This is the entry point for creating all graph nodes. This
 * only creates nodes if they don't exist yet.
 */
export const getNode = <G extends AtomGenerics>(
  ecosystem: Ecosystem,
  template: AtomTemplateBase<G> | ZeduxNode<G> | AtomSelectorOrConfig<G>,
  params?: G['Params']
): ZeduxNode => {
  if ((template as ZeduxNode).izn) {
    // if the passed atom instance is Destroyed, get(/create) the
    // non-Destroyed instance
    return (template as ZeduxNode).l === DESTROYED && (template as ZeduxNode).t
      ? ecosystem.getNode((template as ZeduxNode).t, (template as ZeduxNode).p)
      : template
  }

  if (DEV && typeof params !== 'undefined' && !Array.isArray(params)) {
    throw new TypeError('Zedux: Expected atom params to be an array', {
      cause: params,
    })
  }

  if (is(template, AtomTemplateBase)) {
    const id = (template as AtomTemplate).getNodeId(ecosystem, params)

    // try to find an existing instance
    let instance = ecosystem.n.get(id) as AtomInstance
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
    instance = resolveAtom(ecosystem, template as AtomTemplate)._instantiate(
      ecosystem,
      id,
      (params || []) as G['Params']
    ) as AnyAtomInstance

    schedulerPre(ecosystem)
    try {
      instance.i() // TODO: remove. Run this in AtomInstance constructor
    } finally {
      schedulerPost(ecosystem)
    }

    ecosystem.n.set(instance.id, instance)

    return instance
  }

  if (
    typeof template === 'function' ||
    (template && (template as AtomSelectorConfig).selector)
  ) {
    const selectorOrConfig = template as AtomSelectorOrConfig<G>
    const id = getInstanceId(ecosystem, selectorOrConfig, params)
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
    schedulerPre(ecosystem)
    try {
      instance = new SelectorInstance(
        ecosystem,
        id,
        selectorOrConfig,
        params || []
      )

      ecosystem.n.set(instance.id, instance)

      return instance
    } finally {
      schedulerPost(ecosystem)
    }
  }

  throw new TypeError('Zedux: Expected a template, selector, or graph node', {
    cause: template,
  })
}

export const mapOverrides = (overrides: AnyAtomTemplate[]) =>
  overrides.reduce((map, atom) => {
    map[atom.key] = atom
    return map
  }, {} as Record<string, AnyAtomTemplate>)

export const schedulerPre = (ecosystem: Ecosystem) =>
  ecosystem.syncScheduler.f++

export const schedulerPost = (ecosystem: Ecosystem) =>
  ecosystem.syncScheduler.post()

/**
 * Schedules an async job _if needed_. Otherwise schedules a sync job. Async
 * jobs are upgraded to sync jobs when scheduled in "safe" contexts (outside
 * React renders)
 */
export const scheduleAsync = (ecosystem: Ecosystem, job: Job) =>
  ecosystem.S?.t === 'react'
    ? ecosystem.asyncScheduler.schedule(job)
    : ecosystem.syncScheduler.j.push(job)

export const scheduleSync = (ecosystem: Ecosystem, job: Job) =>
  ecosystem.syncScheduler.schedule(job)
